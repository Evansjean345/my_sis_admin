"use client";

import { useState } from "react";

import Link from "next/link";

import { Building2, CarFront, CarTaxiFront, Cpu, Lock, Plus, Users } from "lucide-react";

import { DetailList } from "@shared/components/detail-list";
import { MetricCard, metricGridClass } from "@shared/components/metric-card";
import { PageHeader } from "@shared/components/page-header";
import { Can } from "@shared/components/providers/access-provider";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { permissionLabel, userStatusMeta } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { UserCreateDialog } from "@shared/features/users/user-create-dialog";
import { useOrganizationOverview } from "@shared/hooks/api/use-admin";
import { useCurrentOrganization } from "@shared/hooks/api/use-auth";
import { useRoles, useRolesMap } from "@shared/hooks/api/use-roles";
import { useUsers } from "@shared/hooks/api/use-users";
import { formatDate, formatNumber, formatRelative } from "@shared/lib/format";

/**
 * Mon organisation — NIVEAU 2.
 *
 * Fiche de l'organisation (GET /organization), effectifs (GET /overview),
 * comptes (GET /users, périmètre du jeton) et rôles attribuables (GET /roles).
 * La fiche elle-même n'est pas modifiable ici : `PATCH /organizations/:id`
 * est réservé à l'exploitant de la plateforme.
 */
export function MyOrganization() {
  const organization = useCurrentOrganization();
  const overview = useOrganizationOverview();
  const users = useUsers({ page: 1, perPage: 8 });
  const roles = useRoles();
  const rolesMap = useRolesMap();
  const [createOpen, setCreateOpen] = useState(false);

  if (organization.isError) {
    return <ErrorState error={organization.error} onRetry={() => organization.refetch()} />;
  }

  const org = organization.data;
  const o = overview.data;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <PageHeader
        title={org?.name ?? "Mon organisation"}
        description="Fiche, effectifs, comptes et rôles de votre organisation"
        actions={
          <Can permission="user:write">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nouvel utilisateur
            </Button>
          </Can>
        }
      >
        {org ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="font-mono">
              {org.code}
            </Badge>
            <StatusBadge tone={org.isActive ? "success" : "neutral"}>
              {org.isActive ? "Active" : "Désactivée"}
            </StatusBadge>
          </div>
        ) : null}
      </PageHeader>

      <div className={metricGridClass}>
        <MetricCard
          icon={CarFront}
          label="Véhicules"
          value={o ? formatNumber(o.vehicles.total) : "—"}
          hint={o ? `${formatNumber(o.vehicles.withDevice)} équipés d'un tracker` : undefined}
        />
        <MetricCard
          icon={CarTaxiFront}
          label="Flottes"
          value={o ? formatNumber(o.groups.vehicles) : "—"}
          hint={o ? `${formatNumber(o.groups.devices)} lots de trackers` : undefined}
        />
        <MetricCard
          icon={Cpu}
          label="Trackers"
          value={o ? formatNumber(o.devices.total) : "—"}
          hint={o ? `${formatNumber(o.devices.assigned)} montés` : undefined}
        />
        <MetricCard
          icon={Users}
          label="Utilisateurs"
          value={o ? formatNumber(o.users.total) : "—"}
          hint={o ? `${formatNumber(o.users.active)} actifs` : undefined}
        />
      </div>

      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" aria-hidden="true" />
              Informations
            </CardTitle>
            <CardDescription>Modifiables par l'exploitant SISBM sur demande.</CardDescription>
          </CardHeader>
          <CardContent>
            {organization.isPending ? (
              <LoadingRows rows={5} className="flex flex-col gap-2" />
            ) : org ? (
              <DetailList
                className="sm:grid-cols-2 xl:grid-cols-1"
                items={[
                  { label: "Raison sociale", value: org.name },
                  { label: "E-mail de contact", value: org.contactEmail ?? "—" },
                  { label: "Téléphone", value: org.contactPhone ?? "—" },
                  { label: "Pays", value: org.countryCode ?? "—" },
                  { label: "Fuseau horaire", value: org.timezone },
                  { label: "Client depuis", value: formatDate(org.createdAt) },
                ]}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Comptes</CardTitle>
            <CardDescription>Derniers comptes de l'organisation</CardDescription>
            <CardAction>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/users" prefetch={false}>
                  Gérer les utilisateurs
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {users.isPending ? (
              <LoadingRows rows={5} />
            ) : users.isError ? (
              <div className="px-6">
                <ErrorState error={users.error} onRetry={() => users.refetch()} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden pr-6 text-right md:table-cell">Dernière connexion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.data.map((u) => {
                    const status = userStatusMeta[u.status];
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="pl-6">
                          <Link
                            href={`/dashboard/users/${u.id}`}
                            prefetch={false}
                            className="flex flex-col hover:underline"
                          >
                            <span className="font-medium">{u.fullName}</span>
                            <span className="text-muted-foreground text-xs">{u.email}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{u.role?.name ?? rolesMap.get(u.roleId)?.name ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </TableCell>
                        <TableCell className="hidden pr-6 text-right text-muted-foreground md:table-cell">
                          {formatRelative(u.lastLoginAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4" aria-hidden="true" />
            Rôles
          </CardTitle>
          <CardDescription>
            Rôles système de la plateforme et rôles propres à votre organisation. Un rôle grisé ne peut pas être
            attribué depuis votre compte.
          </CardDescription>
          <CardAction>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/roles" prefetch={false}>
                Matrice des permissions
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {roles.isPending ? (
            <LoadingRows rows={3} className="col-span-full flex flex-col gap-2" />
          ) : (
            (roles.data ?? []).map((r) => (
              <div key={r.id} className={`rounded-lg border p-3 ${r.assignable === false ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.assignable === false ? (
                    <Badge variant="outline">Non attribuable</Badge>
                  ) : (
                    <Badge variant="secondary">Attribuable</Badge>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground text-xs">{r.description ?? "—"}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.permissions.slice(0, 6).map((p) => (
                    <Badge key={p} variant="outline" className="font-normal text-[11px]">
                      {permissionLabel(p)}
                    </Badge>
                  ))}
                  {r.permissions.length > 6 ? (
                    <Badge variant="outline" className="font-normal text-[11px]">
                      +{r.permissions.length - 6}
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <UserCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
