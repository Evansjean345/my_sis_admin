"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, RefreshCw } from "lucide-react";

import { OrganizationFilter } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { PageHeader } from "@/components/page-header";
import { ErrorState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { queryKeys } from "@/hooks/api/query-keys";
import {
  useAdminActivity,
  useAdminOverview,
  useCommandsStats,
  useDevicesStats,
  useOrganizationsStats,
  useUsersStats,
  useVehiclesStats,
} from "@/hooks/api/use-admin";
import { formatRelative } from "@/lib/format";
import { ACTIVITY_WINDOWS, type ActivityWindow } from "@/types/admin";
import { ApiError } from "@/types/api";

import { ActivityChart } from "./activity-chart";
import { CommandsChart } from "./commands-chart";
import { ConnectionDonut } from "./connection-donut";
import { DeploymentCard } from "./deployment-card";
import { GrowthChart } from "./growth-chart";
import { KpiStrip } from "./kpi-strip";
import { OrganizationsChart } from "./organizations-chart";
import { OrganizationsTable } from "./organizations-table";
import { RecentCommands } from "./recent-commands";

const DEFAULT_WINDOW: ActivityWindow = 30;

function parseWindow(raw: string | null): ActivityWindow {
  const n = Number(raw);
  return (ACTIVITY_WINDOWS as readonly number[]).includes(n)
    ? (n as ActivityWindow)
    : DEFAULT_WINDOW;
}

/**
 * Accueil du tableau de bord d'administration — vue KPI de la plateforme.
 *
 * Les deux filtres (période, organisation) sont dans UNE barre au-dessus de
 * tout ce qu'ils pilotent, et dans l'URL (`?days=30&organizationId=…`) : la
 * vue filtrée se partage et survit à un rechargement. Pendant un
 * rafraîchissement, les graphiques gardent leur rendu précédent
 * (`keepPreviousData`) : pas de squelette, pas de saut de mise en page.
 */
export function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const organizationId = searchParams.get("organizationId") ?? undefined;
  const days = parseWindow(searchParams.get("days"));
  const filter = organizationId ? { organizationId } : {};

  const overview = useAdminOverview();
  const organizations = useOrganizationsStats();
  const activity = useAdminActivity({ ...filter, days });
  const vehicles = useVehiclesStats(filter);
  const devices = useDevicesStats(filter);
  const users = useUsersStats(filter);
  const commands = useCommandsStats(filter);
  const fetching = useIsFetching({ queryKey: queryKeys.admin.all }) > 0;

  const selected = organizations.data?.find((o) => o.id === organizationId);

  const setParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };
  const setOrganization = (id: string | undefined) =>
    setParam("organizationId", id);

  // 403 : compte sans le joker `*`. Inutile d'afficher dix erreurs identiques.
  if (overview.isError) {
    const forbidden =
      overview.error instanceof ApiError && overview.error.status === 403;
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble de la plateforme SISBM"
        />
        <ErrorState
          error={overview.error}
          title={
            forbidden
              ? "Réservé à l'administration de la plateforme"
              : undefined
          }
          onRetry={forbidden ? undefined : () => overview.refetch()}
        />
      </div>
    );
  }

  const statsLoading =
    vehicles.isPending ||
    devices.isPending ||
    users.isPending ||
    commands.isPending;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader
        title="Tableau de bord"
        description={
          selected ? (
            <>
              Vue filtrée sur{" "}
              <span className="font-medium text-foreground">
                {selected.name}
              </span>
            </>
          ) : (
            "Vue d'ensemble de la plateforme SISBM — toutes organisations"
          )
        }
      />

      {/* Barre de filtres : une seule, au-dessus de tout ce qu'elle pilote. */}
      {/* Barre des filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(days)}
          onValueChange={(v) =>
            v && setParam("days", v === String(DEFAULT_WINDOW) ? undefined : v)
          }
          aria-label="Période"
        >
          {ACTIVITY_WINDOWS.map((w) => (
            <ToggleGroupItem key={w} value={String(w)} className="px-3">
              {w} jours
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <OrganizationFilter value={organizationId} onChange={setOrganization} />
        <div className="ml-auto flex items-center gap-3">
          {overview.data ? (
            <span className="hidden items-center gap-1.5 text-muted-foreground text-xs sm:flex">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              Mis à jour {formatRelative(overview.data.generatedAt)}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: queryKeys.admin.all })
            }
            disabled={fetching}
          >
            <RefreshCw
              data-icon="inline-start"
              className={fetching ? "animate-spin" : undefined}
            />
            Actualiser
          </Button>
        </div>
      </div>

      <div
        className={`flex flex-col gap-4 transition-opacity md:gap-6 ${activity.isPlaceholderData ? "opacity-60" : ""}`}
      >
        {/* Activity Cards pour les données soit entreprise / soit flotte */}
        <KpiStrip
          activity={activity.data}
          vehicles={vehicles.data}
          devices={devices.data}
          users={users.data}
          commands={commands.data}
          organizations={
            selected ? undefined : overview.data?.organizations.total
          }
          loading={statsLoading || activity.isPending}
          days={days}
        />

        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 shadow-xl rounded-xl hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
            {/* cartes d'activités pour les stats */}
            <ActivityChart
              days={activity.data?.days}
              loading={activity.isPending}
            />
          </div>
          {/* Stats en Cercle pour afficher les véhicules  */}
          <ConnectionDonut
            counts={vehicles.data?.byConnection}
            loading={vehicles.isPending}
          />
        </div>

        {/* Stats des commandes envoyées par boitier  */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-3 ">
          <div className="xl:col-span-2 rounded-xl hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
            <CommandsChart
              days={activity.data?.days}
              loading={activity.isPending}
            />
          </div>
          {/* Stats des botiers */}
          <DeploymentCard
            devices={devices.data}
            vehicles={vehicles.data}
            loading={statsLoading}
          />
        </div>

        {/* données sur le parc auto */}
        <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
          <div className="rounded-xl shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
            <GrowthChart
              days={activity.data?.days}
              loading={activity.isPending}
            />
          </div>
          <OrganizationsChart
            rows={organizations.data}
            loading={organizations.isPending}
            selectedId={organizationId}
            onSelect={setOrganization}
          />
        </div>
        {/* Commande recente envoyé sur le tracker */}
        <div className="rounded-xl shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
          <RecentCommands filter={filter} />
        </div>
        {/* Listes des entreprises */}
        <div className="rounded-xl shadow-lg hover:cursor-pointer xl:hover:scale-95 transition-all bg-[#0E508D]">
          <OrganizationsTable
            selectedId={organizationId}
            onSelect={setOrganization}
          />
        </div>
      </div>
    </div>
  );
}
