"use client";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "cn";

import { StatusBadge } from "@shared/components/status-badge";
import { userStatusMeta } from "@shared/components/status-labels";
import { Avatar, AvatarBadge, AvatarFallback } from "@shared/components/ui/avatar";
import { OrganizationCell } from "@shared/features/common/organization/organization-select";
import { UserRowActions } from "@shared/features/users/user-row-actions";
import type { DataTableFeatures } from "@shared/lib/data-table-features";
import { formatDateTime, formatRelative } from "@shared/lib/format";
import { getInitials } from "@shared/lib/utils";
import type { Role } from "@shared/types/role";
import type { User } from "@shared/types/user";

function avatarTone(name: string) {
  const tones = [
    "[&_[data-slot=avatar-fallback]]:bg-amber-100 [&_[data-slot=avatar-fallback]]:text-amber-700 dark:[&_[data-slot=avatar-fallback]]:bg-amber-500/15 dark:[&_[data-slot=avatar-fallback]]:text-amber-300",
    "[&_[data-slot=avatar-fallback]]:bg-sky-100 [&_[data-slot=avatar-fallback]]:text-sky-700 dark:[&_[data-slot=avatar-fallback]]:bg-sky-500/15 dark:[&_[data-slot=avatar-fallback]]:text-sky-300",
    "[&_[data-slot=avatar-fallback]]:bg-emerald-100 [&_[data-slot=avatar-fallback]]:text-emerald-700 dark:[&_[data-slot=avatar-fallback]]:bg-emerald-500/15 dark:[&_[data-slot=avatar-fallback]]:text-emerald-300",
    "[&_[data-slot=avatar-fallback]]:bg-violet-100 [&_[data-slot=avatar-fallback]]:text-violet-700 dark:[&_[data-slot=avatar-fallback]]:bg-violet-500/15 dark:[&_[data-slot=avatar-fallback]]:text-violet-300",
    "[&_[data-slot=avatar-fallback]]:bg-rose-100 [&_[data-slot=avatar-fallback]]:text-rose-700 dark:[&_[data-slot=avatar-fallback]]:bg-rose-500/15 dark:[&_[data-slot=avatar-fallback]]:text-rose-300",
  ];
  return tones[name.length % tones.length];
}

function presenceBadge(lastLoginAt: string | null) {
  if (!lastLoginAt) return "bg-muted-foreground";
  const minutes = (Date.now() - new Date(lastLoginAt).getTime()) / 60_000;
  if (minutes < 60) return "bg-green-600";
  if (minutes < 24 * 60) return "bg-amber-500";
  return "bg-muted-foreground";
}

export function UserAvatar({ user, size = "lg" }: { user: User; size?: "default" | "lg" }) {
  return (
    <Avatar size={size} className={cn("font-medium", avatarTone(user.fullName))}>
      <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
      <AvatarBadge className={presenceBadge(user.lastLoginAt)} />
    </Avatar>
  );
}

export function getUsersColumns(roles: Map<string, Role>): ColumnDef<DataTableFeatures, User>[] {
  return [
    {
      id: "search",
      accessorFn: (row) => `${row.fullName} ${row.email} ${row.phone ?? ""}`,
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "fullName",
      header: "Utilisateur",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <UserAvatar user={row.original} />
          <div className="min-w-0">
            <Link
              href={`/dashboard/users/${row.original.id}`}
              prefetch={false}
              className="block truncate font-medium text-foreground text-sm hover:underline"
            >
              {row.original.fullName}
            </Link>
            <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: "role",
      accessorFn: (row) => row.roleId,
      header: "Rôle",
      filterFn: "equalsString",
      cell: ({ row }) => {
        // `/admin/users` embarque le rôle : il couvre aussi les rôles propres aux autres organisations.
        const role = row.original.role ?? roles.get(row.original.roleId);
        return (
          <div className="grid gap-0.5">
            <span className="whitespace-nowrap">{role?.name ?? "—"}</span>
            <span className="text-muted-foreground text-xs">{role?.code ?? ""}</span>
          </div>
        );
      },
    },
    {
      id: "organization",
      accessorFn: (row) => row.organization?.name ?? "",
      header: "Organisation",
      cell: ({ row }) => <OrganizationCell organization={row.original.organization} />,
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.phone ?? "—"}</span>,
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const meta = userStatusMeta[row.original.status];
        return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
      },
    },
    {
      id: "lastLoginAt",
      accessorFn: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).getTime() : 0),
      header: "Dernière connexion",
      cell: ({ row }) => (
        <div className="grid gap-0.5">
          <span className="text-sm">{formatRelative(row.original.lastLoginAt)}</span>
          <span className="text-muted-foreground text-xs">{row.original.lastLoginIp ?? ""}</span>
        </div>
      ),
    },
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      header: "Créé le",
      cell: ({ row }) => <div className="text-foreground text-sm">{formatDateTime(row.original.createdAt)}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <UserRowActions user={row.original} />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
  ];
}
