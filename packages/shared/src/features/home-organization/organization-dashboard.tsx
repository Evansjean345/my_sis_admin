"use client";

import { useMemo } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, RefreshCw } from "lucide-react";

import { PageHeader } from "@shared/components/page-header";
import { useAccess } from "@shared/components/providers/access-provider";
import { ErrorState } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group";
import { LiveFleetCard } from "@shared/features/common/live/live-fleet-card";
import { fleetState } from "@shared/features/fleet/fleet-state";
import { OrgKpis } from "@shared/features/home-organization/org-kpis";
import { QuickActions } from "@shared/features/home-organization/quick-actions";
import { ActivityChart } from "@shared/features/home-platform/activity-chart";
import { CommandsChart } from "@shared/features/home-platform/commands-chart";
import { ConnectionDonut } from "@shared/features/home-platform/connection-donut";
import { DeploymentCard } from "@shared/features/home-platform/deployment-card";
import { RecentCommands } from "@shared/features/home-platform/recent-commands";
import { queryKeys } from "@shared/hooks/api/query-keys";
import {
  useAdminActivity,
  useDevicesStats,
  useOrganizationOverview,
  useVehiclesStats,
} from "@shared/hooks/api/use-admin";
import { useFleet } from "@shared/hooks/api/use-fleet";
import { useLiveVehicles } from "@shared/hooks/use-live-vehicles";
import { formatRelative } from "@shared/lib/format";
import { useRealtimeStore } from "@shared/stores/realtime/realtime-store";
import { ACTIVITY_WINDOWS, type ActivityWindow } from "@shared/types/admin";

const DEFAULT_WINDOW: ActivityWindow = 30;
const NO_FILTER = {};

function parseWindow(raw: string | null): ActivityWindow {
  const n = Number(raw);
  return (ACTIVITY_WINDOWS as readonly number[]).includes(n) ? (n as ActivityWindow) : DEFAULT_WINDOW;
}

/**
 * Tableau de bord NIVEAU 2 — administrateur d'une organisation.
 *
 * Construit à partir du tableau de bord principal (mêmes graphiques, même
 * rythme visuel), mais alimenté par les routes de l'ORGANISATION du jeton
 * (`/overview`, `/stats/activity`, `/<ressource>/stats`, `/fleet/live`,
 * `/commands`) : aucune donnée d'un autre client, aucun filtre
 * d'organisation à proposer. La carte reçoit les positions en temps réel.
 */
export function OrganizationDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { organizationName } = useAccess();

  const days = parseWindow(searchParams.get("days"));

  const overview = useOrganizationOverview();
  const activity = useAdminActivity({ days });
  const vehicles = useVehiclesStats(NO_FILTER);
  const devices = useDevicesStats(NO_FILTER);
  const fleet = useFleet();
  const liveVehicles = useLiveVehicles(fleet.vehicles);
  const liveReceived = useRealtimeStore((s) => s.received);
  const fetching = useIsFetching({ queryKey: queryKeys.admin.all }) > 0;

  const movingNow = useMemo(
    () => liveVehicles.filter((v) => ["moving", "alert"].includes(fleetState(v))).length,
    [liveVehicles],
  );

  const setDays = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === String(DEFAULT_WINDOW)) next.delete("days");
    else next.set("days", value);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    fleet.refetch();
  };

  const name = overview.data?.organization?.name ?? organizationName;

  if (overview.isError) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader title="Tableau de bord" description="Administration de votre organisation" />
        <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Tableau de bord"
        description={
          name ? (
            <>
              Administration de <span className="font-medium text-foreground">{name}</span> — véhicules, flottes,
              trackers et utilisateurs
            </>
          ) : (
            "Administration de votre organisation"
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(days)}
          onValueChange={(v) => v && setDays(v)}
          aria-label="Période"
        >
          {ACTIVITY_WINDOWS.map((w) => (
            <ToggleGroupItem key={w} value={String(w)} className="px-3">
              {w} jours
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-3">
          {overview.data ? (
            <span className="hidden items-center gap-1.5 text-muted-foreground text-xs sm:flex">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              Mis à jour {formatRelative(overview.data.generatedAt)}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={refresh} disabled={fetching}>
            <RefreshCw data-icon="inline-start" className={fetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </div>
      </div>

      <OrgKpis
        overview={overview.data}
        loading={overview.isPending}
        movingNow={movingNow}
        liveReceived={liveReceived}
      />

      <LiveFleetCard vehicles={liveVehicles} loading={fleet.isPending} title="Ma flotte en direct" />

      <div
        className={`flex flex-col gap-4 transition-opacity md:gap-6 ${activity.isPlaceholderData ? "opacity-60" : ""}`}
      >
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="rounded-xl bg-[#0E508D] shadow-xl xl:col-span-2">
            <ActivityChart days={activity.data?.days} loading={activity.isPending} />
          </div>
          <ConnectionDonut counts={vehicles.data?.byConnection} loading={vehicles.isPending} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="rounded-xl bg-[#0E508D] xl:col-span-2">
            <CommandsChart days={activity.data?.days} loading={activity.isPending} />
          </div>
          <DeploymentCard
            devices={devices.data}
            vehicles={vehicles.data}
            loading={devices.isPending || vehicles.isPending}
          />
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:gap-6 xl:grid-cols-3">
          <div className="rounded-xl shadow-lg xl:col-span-2">
            <RecentCommands filter={NO_FILTER} />
          </div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
