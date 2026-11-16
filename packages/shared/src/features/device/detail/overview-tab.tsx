"use client";

import Link from "next/link";

import { AlertTriangle, CheckCircle2, Truck } from "lucide-react";

import { DetailList } from "@shared/components/detail-list";
import { EmptyState } from "@shared/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { deviceHref } from "@shared/features/device/device-links";
import { useDeviceDiagnostic } from "@shared/hooks/api/use-devices";
import { formatDateTime, formatRelative } from "@shared/lib/format";
import type { DeviceDetail } from "@shared/types/device";

export function OverviewTab({ device }: { device: DeviceDetail }) {
  const linked = Boolean(device.flespiDeviceId);
  const diagnostic = useDeviceDiagnostic(device.id, linked);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Fiche du tracker</CardTitle>
          <CardDescription>Données enregistrées dans SISBM.</CardDescription>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "IMEI", value: device.imei, mono: true },
              { label: "Numéro de série", value: device.serialNumber ?? "—" },
              { label: "Fabricant", value: <span className="capitalize">{device.manufacturer}</span> },
              { label: "Modèle", value: device.model },
              { label: "Protocole", value: device.protocol ?? "—" },
              { label: "Firmware", value: device.firmwareVersion ?? "—" },
              { label: "Relais de coupure", value: device.hasRelay ? "Oui" : "Non" },
              { label: "SIM (MSISDN)", value: device.simMsisdn ?? "—" },
              { label: "ICCID", value: device.simIccid ?? "—", mono: Boolean(device.simIccid) },
              { label: "Opérateur", value: device.simOperator ?? "—" },
              { label: "Device flespi", value: device.flespiDeviceId ?? "—", mono: true },
              { label: "Canal flespi", value: device.flespiChannelId ?? "—", mono: true },
              { label: "Ident flespi", value: device.flespiIdent ?? "—", mono: true },
              { label: "Dernier contact", value: formatDateTime(device.lastSeenAt) },
              { label: "Enregistré le", value: formatDateTime(device.createdAt) },
              { label: "Mis à jour", value: formatRelative(device.updatedAt) },
            ]}
          />
          {device.notes ? <p className="mt-5 text-muted-foreground text-sm">{device.notes}</p> : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Affectation</CardTitle>
          </CardHeader>
          <CardContent>
            {device.assignment ? (
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Truck className="size-5" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/dashboard/vehicles/${device.assignment.id}`}
                    prefetch={false}
                    className="truncate font-medium hover:underline"
                  >
                    {device.assignment.registration}
                  </Link>
                  <span className="text-muted-foreground text-xs">
                    Monté le {formatDateTime(device.assignment.installed_at)}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState icon={<Truck />} title="Non monté" description="Ce tracker n'est affecté à aucun véhicule." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>État flespi</CardTitle>
            <CardAction>
              <Button size="sm" variant="link" asChild disabled={!linked}>
                <Link href={deviceHref(device.id, "diagnostic")} prefetch={false} scroll={false}>
                  Diagnostic complet
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!linked ? (
              <p className="text-muted-foreground text-sm">Non rattaché.</p>
            ) : diagnostic.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : diagnostic.isError ? (
              <p className="text-destructive text-sm">Diagnostic indisponible.</p>
            ) : diagnostic.data.problems.length === 0 ? (
              <Alert>
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertTitle>Aucun problème détecté</AlertTitle>
                <AlertDescription>Dernière trame {formatRelative(diagnostic.data.lastMessageAt)}.</AlertDescription>
              </Alert>
            ) : (
              diagnostic.data.problems.map((problem) => (
                <Alert key={problem} variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertDescription>{problem}</AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
