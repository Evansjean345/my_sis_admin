"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArrowLeft, Link2, Pencil, RefreshCw, Truck, Zap } from "lucide-react";

import { Can } from "@shared/components/providers/access-provider";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { CommandsTab } from "@shared/features/device/detail/commands-tab";
import { DeviceEditDialog } from "@shared/features/device/detail/device-edit-dialog";
import { DiagnosticTab } from "@shared/features/device/detail/diagnostic-tab";
import { FlespiSyncDialog } from "@shared/features/device/detail/flespi-sync-dialog";
import { LogsTab } from "@shared/features/device/detail/logs-tab";
import { OverviewTab } from "@shared/features/device/detail/overview-tab";
import { TelemetryTab } from "@shared/features/device/detail/telemetry-tab";
import { DeviceActions } from "@shared/features/device/device-actions";
import { DeviceStatusBadge, FlespiBadge } from "@shared/features/device/device-badges";
import type { DeviceTab } from "@shared/features/device/device-links";
import { useDevice } from "@shared/hooks/api/use-devices";

const TABS: DeviceTab[] = ["overview", "telemetry", "commands", "diagnostic", "logs"];

export function DeviceDetailView({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab") as DeviceTab | null;
  const tab: DeviceTab = requested && TABS.includes(requested) ? requested : "overview";

  const device = useDevice(id);
  const [dialog, setDialog] = useState<"edit" | "sync" | null>(null);

  if (device.isPending) return <LoadingRows rows={8} />;
  if (device.isError) return <ErrorState error={device.error} onRetry={() => device.refetch()} />;

  const d = device.data;
  const linked = Boolean(d.flespiDeviceId);
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/device" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Trackers
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="truncate font-medium font-mono text-2xl leading-none tracking-tight sm:text-3xl">{d.imei}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className="capitalize">
              {d.manufacturer} {d.model}
            </span>
            <DeviceStatusBadge status={d.status} />
            <FlespiBadge device={d} />
            {d.assignment ? (
              <Link
                href={`/dashboard/vehicles/${d.assignment.id}`}
                prefetch={false}
                className="inline-flex items-center gap-1 text-foreground hover:underline"
              >
                <Truck className="size-3.5" />
                {d.assignment.registration}
              </Link>
            ) : (
              <span>Non monté</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Can levels={[1]}>
            {!linked ? (
              <Button size="sm" onClick={() => setDialog("sync")}>
                <Zap data-icon="inline-start" />
                Rattacher à flespi
              </Button>
            ) : null}
          </Can>
          <Can permission="device:write">
            <Button size="sm" variant="outline" onClick={() => setDialog("edit")}>
              <Pencil data-icon="inline-start" />
              Modifier
            </Button>
          </Can>
          <Button size="sm" variant="outline" onClick={() => device.refetch()} disabled={device.isFetching}>
            <RefreshCw className={device.isFetching ? "animate-spin" : undefined} />
            <span className="sr-only">Actualiser</span>
          </Button>
          <DeviceActions device={d} showDetails={false} onDeleted={() => router.replace("/dashboard/device")} />
        </div>
      </div>

      {!linked ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
          <Link2 className="size-4" />
          <AlertTitle>Tracker non rattaché à flespi</AlertTitle>
          <AlertDescription>
            Télémétrie, diagnostic, journaux et commandes sont indisponibles tant que le boîtier n'est pas rattaché.
          </AlertDescription>
          <AlertAction>
            <Can levels={[1]}>
              <Button size="sm" variant="link" onClick={() => setDialog("sync")}>
                Rattacher
              </Button>
            </Can>
          </AlertAction>
        </Alert>
      ) : null}

      <Tabs
        className="gap-4"
        value={tab}
        onValueChange={(value) => router.replace(`${pathname}?tab=${value}`, { scroll: false })}
      >
        <div className="scrollbar-none overflow-x-auto border-b">
          <TabsList variant="line" className="w-max justify-start gap-2 ps-0 *:data-[slot=tabs-trigger]:flex-none">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="telemetry" disabled={!linked}>
              Télémétrie
            </TabsTrigger>
            <TabsTrigger value="commands">Commandes</TabsTrigger>
            <TabsTrigger value="diagnostic" disabled={!linked}>
              Protocole et diagnostic
            </TabsTrigger>
            <TabsTrigger value="logs" disabled={!linked}>
              Connexion et journaux
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab device={d} />
        </TabsContent>
        <TabsContent value="telemetry">
          {tab === "telemetry" && linked ? <TelemetryTab deviceId={d.id} /> : null}
        </TabsContent>
        <TabsContent value="commands">{tab === "commands" ? <CommandsTab device={d} /> : null}</TabsContent>
        <TabsContent value="diagnostic">
          {tab === "diagnostic" && linked ? <DiagnosticTab deviceId={d.id} /> : null}
        </TabsContent>
        <TabsContent value="logs">{tab === "logs" && linked ? <LogsTab deviceId={d.id} /> : null}</TabsContent>
      </Tabs>

      <DeviceEditDialog device={d} open={dialog === "edit"} onOpenChange={close} />
      <FlespiSyncDialog device={d} open={dialog === "sync"} onOpenChange={close} />
    </div>
  );
}
