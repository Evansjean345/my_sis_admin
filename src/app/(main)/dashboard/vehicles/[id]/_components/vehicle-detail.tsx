"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Cpu,
  Gauge,
  Link2,
  Pencil,
  RefreshCw,
  Unlink,
} from "lucide-react";

import { DetailList } from "@/components/detail-list";
import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import {
  vehicleStatusMeta,
  vehicleTypeLabels,
} from "@/components/status-labels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useVehicle } from "@/hooks/api/use-vehicles";
import { formatDateTime, formatNumber } from "@/lib/format";

import { AssignDialog } from "../../../_components/assignment/assign-dialog";
import { UnassignDialog } from "../../../_components/assignment/unassign-dialog";
import { CommandHistoryTable } from "../../../_components/commands/command-history-table";
import { SecurityActions } from "../../../_components/commands/security-actions";
import { SpeedLimitDialog } from "../../_components/speed-limit-dialog";
import { VehicleFormDialog } from "../../_components/vehicle-form-dialog";
import { VehicleRowActions } from "../../_components/vehicle-row-actions";
import { PositionCard } from "./position-card";
import { VehicleDriversCard } from "./vehicle-drivers-card";
import { VehicleScheduleCard } from "./vehicle-schedule-card";

export function VehicleDetailView({ id }: { id: string }) {
  const router = useRouter();
  const vehicle = useVehicle(id);
  const [dialog, setDialog] = useState<
    "edit" | "speed" | "assign" | "unassign" | null
  >(null);

  if (vehicle.isPending) return <LoadingRows rows={8} />;
  if (vehicle.isError)
    return (
      <ErrorState error={vehicle.error} onRetry={() => vehicle.refetch()} />
    );

  const v = vehicle.data;
  const meta = vehicleStatusMeta[v.status] ?? {
    label: v.status,
    tone: "neutral" as const,
  };
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/vehicles" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Véhicules
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-medium text-2xl leading-none tracking-tight sm:text-3xl">
            {v.registration}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>
              {[v.brand, v.model, v.year].filter(Boolean).join(" · ") || "—"}
            </span>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            <StatusBadge tone="info" dot={false}>
              <Gauge className="size-3" />
              {formatNumber(v.speedLimitKph)} km/h
            </StatusBadge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecurityActions
            vehicleId={v.id}
            deviceId={v.device?.id}
            hasRelay={Boolean(v.device?.hasRelay)}
            immobilizationEnabled={v.immobilizationEnabled}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => vehicle.refetch()}
            disabled={vehicle.isFetching}
          >
            <RefreshCw
              className={vehicle.isFetching ? "animate-spin" : undefined}
            />
            <span className="sr-only">Actualiser</span>
          </Button>
          <VehicleRowActions
            vehicle={v}
            showView={false}
            onDeleted={() => router.replace("/dashboard/vehicles")}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informations</CardTitle>
              <CardDescription>
                Identité et paramètres du véhicule.
              </CardDescription>
              <CardAction className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog("speed")}
                >
                  <Gauge data-icon="inline-start" />
                  Vitesse
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDialog("edit")}
                >
                  <Pencil data-icon="inline-start" />
                  Modifier
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Immatriculation", value: v.registration },
                  { label: "Libellé", value: v.label ?? "—" },
                  {
                    label: "Type",
                    value: vehicleTypeLabels[v.vehicleType] ?? v.vehicleType,
                  },
                  { label: "Marque", value: v.brand ?? "—" },
                  { label: "Modèle", value: v.model ?? "—" },
                  { label: "Année", value: v.year ?? "—" },
                  { label: "Couleur", value: v.color ?? "—" },
                  { label: "VIN", value: v.vin ?? "—", mono: Boolean(v.vin) },
                  {
                    label: "Kilométrage",
                    value: `${formatNumber(v.odometerKm)} km`,
                  },
                  {
                    label: "Limite de vitesse",
                    value: `${formatNumber(v.speedLimitKph)} km/h`,
                  },
                  {
                    label: "Immobilisation",
                    value: v.immobilizationEnabled ? "Autorisée" : "Désactivée",
                  },
                  { label: "Créé le", value: formatDateTime(v.createdAt) },
                ]}
              />
              {v.notes ? (
                <p className="mt-5 text-muted-foreground text-sm">{v.notes}</p>
              ) : null}
            </CardContent>
          </Card>

          {v.device ? <CommandHistoryTable deviceId={v.device.id} /> : null}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Tracker monté</CardTitle>
              <CardAction>
                {v.device ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDialog("unassign")}
                  >
                    <Unlink data-icon="inline-start" />
                    Démonter
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setDialog("assign")}>
                    <Link2 data-icon="inline-start" />
                    Monter
                  </Button>
                )}
              </CardAction>
            </CardHeader>
            <CardContent>
              {v.device ? (
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Cpu className="size-5" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/dashboard/device/${v.device.id}`}
                      prefetch={false}
                      className="truncate font-medium font-mono text-sm hover:underline"
                    >
                      {v.device.imei}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {v.device.model} ·{" "}
                      {v.device.hasRelay ? "avec relais" : "sans relais"}
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Cpu />}
                  title="Aucun tracker"
                  description="Montez un tracker pour suivre ce véhicule."
                />
              )}
            </CardContent>
          </Card>

          <PositionCard position={v.lastPosition} id={v.id} />
          <VehicleScheduleCard vehicleId={v.id} />
          <VehicleDriversCard vehicleId={v.id} />
        </div>
      </div>

      <VehicleFormDialog
        vehicle={v}
        open={dialog === "edit"}
        onOpenChange={close}
      />
      <SpeedLimitDialog
        vehicle={v}
        open={dialog === "speed"}
        onOpenChange={close}
      />
      <AssignDialog
        mode="vehicle"
        vehicleId={v.id}
        vehicleLabel={v.registration}
        organizationId={v.organizationId}
        open={dialog === "assign"}
        onOpenChange={close}
      />
      {v.device ? (
        <UnassignDialog
          deviceId={v.device.id}
          label={v.device.imei}
          open={dialog === "unassign"}
          onOpenChange={close}
        />
      ) : null}
    </div>
  );
}
