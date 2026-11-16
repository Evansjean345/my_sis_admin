import Link from "next/link";

import { BadgeCheck, KeyRound, Mail } from "lucide-react";

import { StatusBadge } from "@shared/components/status-badge";
import { userStatusMeta } from "@shared/components/status-labels";
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { getInitials } from "@shared/lib/utils";
import type { CurrentUser } from "@shared/types/auth";
import type { UserDetail } from "@shared/types/user";

interface ProfileHeaderProps {
  user: CurrentUser;
  detail?: UserDetail;
  roleName?: string;
}

export function ProfileHeader({ user, detail, roleName }: ProfileHeaderProps) {
  const status = detail ? userStatusMeta[detail.status] : null;

  return (
    <div className="flex flex-col gap-5 px-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-16 after:border-0 sm:size-20">
          <AvatarFallback className="text-lg">{getInitials(user.fullName)}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="truncate font-heading font-semibold text-xl leading-6 tracking-tight sm:text-2xl sm:leading-7">
              {user.fullName}
            </h1>
            <p className="truncate text-muted-foreground text-sm leading-5">
              {user.email}
              {roleName ? ` · ${roleName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
            {roleName ? (
              <Badge className="rounded-sm bg-green-600 text-white" variant="default">
                <BadgeCheck data-icon="inline-start" />
                {roleName}
              </Badge>
            ) : null}
            {detail?.timezone ? (
              <Badge className="rounded-sm" variant="outline">
                {detail.timezone}
              </Badge>
            ) : null}
            {detail?.locale ? (
              <Badge className="rounded-sm uppercase" variant="outline">
                {detail.locale}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" asChild variant="outline">
          <a href={`mailto:${user.email}`}>
            <Mail data-icon="inline-start" />
            E-mail
          </a>
        </Button>
        <Button size="sm" asChild>
          <Link href="/dashboard/profile?tab=security" prefetch={false} scroll={false}>
            <KeyRound data-icon="inline-start" />
            Changer le mot de passe
          </Link>
        </Button>
      </div>
    </div>
  );
}
