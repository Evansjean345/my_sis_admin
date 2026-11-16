"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Pencil } from "lucide-react";

import { DetailList } from "@shared/components/detail-list";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { permissionLabel, userStatusMeta } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { UserEditDialog } from "@shared/features/users/user-edit-dialog";
import { UserRowActions } from "@shared/features/users/user-row-actions";
import { UserAvatar } from "@shared/features/users/users-columns";
import { useUser } from "@shared/hooks/api/use-users";
import { formatDateTime, formatRelative } from "@shared/lib/format";

export function UserDetailView({ id }: { id: string }) {
  const router = useRouter();
  const user = useUser(id);
  const [editOpen, setEditOpen] = useState(false);

  if (user.isPending) return <LoadingRows rows={6} />;
  if (user.isError) return <ErrorState error={user.error} onRetry={() => user.refetch()} />;

  const u = user.data;
  const meta = userStatusMeta[u.status];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/users" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Utilisateurs
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar user={u} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="truncate font-medium text-2xl leading-none tracking-tight sm:text-3xl">{u.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <span>{u.email}</span>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
              {u.role ? (
                <Badge variant="outline" className="rounded-sm">
                  {u.role.name}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Modifier
          </Button>
          <UserRowActions user={u} onDeleted={() => router.replace("/dashboard/users")} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Informations</CardTitle>
            <CardDescription>Coordonnées et préférences du compte.</CardDescription>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "Nom complet", value: u.fullName },
                { label: "E-mail", value: u.email },
                { label: "Téléphone", value: u.phone ?? "—" },
                { label: "Langue", value: u.locale === "en" ? "English" : "Français" },
                { label: "Fuseau horaire", value: u.timezone },
                { label: "Créé le", value: formatDateTime(u.createdAt) },
                { label: "Dernière connexion", value: `${formatDateTime(u.lastLoginAt, "Jamais")}` },
                { label: "IP de connexion", value: u.lastLoginIp ?? "—" },
                { label: "Tentatives échouées", value: String(u.failedAttempts) },
                { label: "Verrouillé jusqu'au", value: formatDateTime(u.lockedUntil) },
                { label: "Mot de passe modifié", value: formatDateTime(u.passwordChangedAt, "Jamais") },
                { label: "Mis à jour", value: formatRelative(u.updatedAt) },
                { label: "ID", value: u.id, mono: true },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>{u.role?.name ?? "Rôle"}</CardTitle>
            <CardDescription>{u.role ? `Code : ${u.role.code}` : "Rôle non renvoyé par l'API."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(u.role?.permissions ?? []).map((permission) => (
              <Badge key={permission} variant="outline" className="rounded-sm" title={permission}>
                {permissionLabel(permission)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <UserEditDialog user={u} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
