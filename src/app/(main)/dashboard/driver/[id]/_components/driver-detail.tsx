"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";

import { DetailList } from "@/components/detail-list";
import { ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDriver } from "@/hooks/api/use-drivers";
import { useOrganizationLabel } from "@/hooks/api/use-organizations";
import { formatDate, formatDateTime } from "@/lib/format";
import { driverStatusMeta } from "@/types/driver";

import { DriverFormDialog } from "../../_components/driver-form-dialog";
import { DriverRowActions } from "../../_components/driver-row-actions";
import { licenseState } from "../../_components/license-state";
import { DriverGroupsCard } from "./driver-groups-card";
import { DriverOrganizationCard } from "./driver-organization-card";
import { DriverVehicleCard } from "./driver-vehicle-card";

/**
 * Fiche conducteur : identité et permis, puis ce que l'admin pilote —
 * l'organisation (ajouter, déplacer, retirer), le véhicule et les équipes.
 */
export function DriverDetail({ id }: { id: string }) {
  const router = useRouter();
  const driver = useDriver(id);
  const organization = useOrganizationLabel(driver.data?.organizationId, driver.data?.organization);
  const [editOpen, setEditOpen] = useState(false);

  if (driver.isPending) return <LoadingRows rows={8} />;
  if (driver.isError) {
    return <ErrorState error={driver.error} onRetry={() => driver.refetch()} title="Conducteur introuvable" />;
  }

  const d = driver.data;
  const meta = driverStatusMeta[d.status] ?? { label: d.status, tone: "neutral" as const };
  const permis = licenseState(d.licenseExpiresOn);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/driver" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Conducteurs
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-medium text-2xl leading-none tracking-tight sm:text-3xl">{d.fullName}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{d.employeeCode ? `Matricule ${d.employeeCode}` : "Sans matricule"}</span>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            <StatusBadge tone={d.organizationId ? "info" : "neutral"} dot={false}>
              {organization?.name ?? (d.organizationId ? "Organisation" : "Vivier")}
            </StatusBadge>
            {permis ? (
              <StatusBadge tone={permis === "expired" ? "danger" : "warning"} dot={false}>
                Permis {permis === "expired" ? "expiré" : "bientôt expiré"}
              </StatusBadge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => driver.refetch()} disabled={driver.isFetching}>
            <RefreshCw className={driver.isFetching ? "animate-spin" : undefined} />
            <span className="sr-only">Actualiser</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Modifier
          </Button>
          <DriverRowActions driver={d} showView={false} onDeleted={() => router.replace("/dashboard/driver")} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informations</CardTitle>
              <CardDescription>Identité, coordonnées et permis de conduire.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Prénom", value: d.firstName },
                  { label: "Nom", value: d.lastName },
                  { label: "Matricule", value: d.employeeCode ?? "—" },
                  { label: "Téléphone", value: d.phone ?? "—" },
                  { label: "E-mail", value: d.email ?? "—" },
                  { label: "N° de permis", value: d.licenseNumber ?? "—", mono: Boolean(d.licenseNumber) },
                  {
                    label: "Catégories",
                    value: d.licenseCategories.length ? d.licenseCategories.join(" · ") : "—",
                  },
                  { label: "Permis valable jusqu'au", value: formatDate(d.licenseExpiresOn) },
                  { label: "Créé le", value: formatDateTime(d.createdAt) },
                ]}
              />
              {d.notes ? <p className="mt-5 text-muted-foreground text-sm">{d.notes}</p> : null}
            </CardContent>
          </Card>
          <DriverGroupsCard driver={d} />
        </div>
        <div className="flex flex-col gap-4">
          <DriverOrganizationCard driver={d} />
          <DriverVehicleCard driver={d} />
        </div>
      </div>

      <DriverFormDialog driver={d} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
