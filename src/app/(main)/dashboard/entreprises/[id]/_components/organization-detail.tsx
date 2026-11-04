"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, Pencil, RefreshCw, Truck, Users } from "lucide-react";

import { DetailList } from "@/components/detail-list";
import { MetricCard, metricGridClass } from "@/components/metric-card";
import { ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganization } from "@/hooks/api/use-organizations";
import { formatDateTime, formatNumber } from "@/lib/format";

import { AuditLogPanel } from "../../../_components/audit/audit-log-panel";
import { OrganizationFormDialog } from "../../_components/organization-form-dialog";
import { OrganizationRowActions } from "../../_components/organization-row-actions";
import { OrganizationRolesCard } from "./organization-roles-card";
import { OrganizationUsersCard } from "./organization-users-card";

/** Détail d'une entreprise : identité, comptes, rôles et journal d'audit. */
export function OrganizationDetail({ id }: { id: string }) {
  const organization = useOrganization(id);
  const [editOpen, setEditOpen] = useState(false);

  if (organization.isPending) return <LoadingRows rows={8} />;
  if (organization.isError) {
    return (
      <ErrorState error={organization.error} onRetry={() => organization.refetch()} title="Organisation indisponible" />
    );
  }

  const data = organization.data;
  const maxVehicles = data.settings?.maxVehicles;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/entreprises" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Entreprises
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-medium text-2xl leading-none tracking-tight sm:text-3xl">{data.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="font-mono text-xs">{data.code}</span>
            {data.isActive ? (
              <StatusBadge tone="success">Active</StatusBadge>
            ) : (
              <StatusBadge tone="orange">Désactivée</StatusBadge>
            )}
            <span>
              {data.countryCode ?? "—"} · {data.timezone}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => organization.refetch()} disabled={organization.isFetching}>
            <RefreshCw className={organization.isFetching ? "animate-spin" : undefined} />
            <span className="sr-only">Actualiser</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Modifier
          </Button>
          <OrganizationRowActions organization={data} showView={false} />
        </div>
      </div>

      <div className={metricGridClass}>
        <MetricCard
          icon={Users}
          label="Comptes"
          value={formatNumber(data.stats.users)}
          hint="Utilisateurs rattachés."
        />
        <MetricCard
          icon={Truck}
          label="Véhicules"
          value={formatNumber(data.stats.vehicles)}
          hint={
            typeof maxVehicles === "number" ? `Plafond fixé à ${formatNumber(maxVehicles)}.` : "Aucun plafond fixé."
          }
        />
      </div>

      <Tabs defaultValue="identity">
        <TabsList>
          <TabsTrigger value="identity">Identité</TabsTrigger>
          <TabsTrigger value="users">Comptes</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="audit">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informations</CardTitle>
              <CardDescription>Coordonnées et paramètres régionaux de l'organisation.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Raison sociale", value: data.name },
                  { label: "Code", value: data.code, mono: true },
                  { label: "E-mail de contact", value: data.contactEmail ?? "—" },
                  { label: "Téléphone", value: data.contactPhone ?? "—" },
                  { label: "Pays", value: data.countryCode ?? "—" },
                  { label: "Fuseau horaire", value: data.timezone },
                  { label: "Plafond de véhicules", value: typeof maxVehicles === "number" ? maxVehicles : "—" },
                  { label: "Identifiant", value: data.id, mono: true },
                  { label: "Créée le", value: formatDateTime(data.createdAt) },
                  { label: "Modifiée le", value: formatDateTime(data.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-4">
          <OrganizationUsersCard organizationId={data.id} organizationName={data.name} />
        </TabsContent>

        <TabsContent value="roles" className="pt-4">
          <OrganizationRolesCard organizationId={data.id} />
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <AuditLogPanel
            source={{ scope: "organization", organizationId: data.id }}
            title="Journal de l'organisation"
            description="Actes tracés pour cette organisation, tous périmètres confondus."
          />
        </TabsContent>
      </Tabs>

      <OrganizationFormDialog organization={data} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
