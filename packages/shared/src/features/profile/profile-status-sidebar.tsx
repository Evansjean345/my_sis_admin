import { CalendarDays, CircleCheck, Clock3, KeyRound, ShieldAlert } from "lucide-react";

import { Separator } from "@shared/components/ui/separator";
import { formatDateTime, formatRelative } from "@shared/lib/format";
import type { UserDetail } from "@shared/types/user";

export function ProfileStatusSidebar({ detail }: { detail?: UserDetail }) {
  if (!detail) {
    return (
      <aside className="flex flex-col gap-2">
        <h2 className="font-heading font-medium text-sm">Activité du compte</h2>
        <p className="text-muted-foreground text-xs">
          Le détail d'activité n'est pas disponible avec votre niveau d'accès.
        </p>
      </aside>
    );
  }

  const locked = detail.lockedUntil && new Date(detail.lockedUntil) > new Date();

  return (
    <aside>
      <div className="flex flex-col gap-4">
        <h2 className="font-heading font-medium text-sm">Activité du compte</h2>
        <div className="flex items-start gap-2">
          {locked ? (
            <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 text-destructive" />
          ) : (
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm">{locked ? "Compte verrouillé" : "Accès actif"}</p>
            <p className="text-muted-foreground text-xs">
              {locked
                ? `Jusqu'au ${formatDateTime(detail.lockedUntil)}`
                : `${detail.failedAttempts} tentative(s) échouée(s)`}
            </p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Mis à jour {formatRelative(detail.updatedAt)}</p>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col">
        <div className="flex gap-3 py-2.5">
          <Clock3 aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Dernière connexion</p>
            <p className="text-muted-foreground text-xs">
              {formatDateTime(detail.lastLoginAt, "Jamais")}
              {detail.lastLoginIp ? ` · ${detail.lastLoginIp}` : ""}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex gap-3 py-2.5">
          <KeyRound aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Mot de passe modifié</p>
            <p className="text-muted-foreground text-xs">{formatDateTime(detail.passwordChangedAt, "Jamais")}</p>
          </div>
        </div>
        <Separator />
        <div className="flex gap-3 py-2.5">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Compte créé</p>
            <p className="text-muted-foreground text-xs">{formatDateTime(detail.createdAt)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
