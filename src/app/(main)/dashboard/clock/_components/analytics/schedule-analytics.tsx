"use client";

import { useEffect, useMemo, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  CalendarClock,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Info,
  PowerOff,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { OrganizationFilter } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { MetricCard, metricGridClass } from "@/components/metric-card";
import { EmptyState, ErrorState } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useScheduleAnalyticsData } from "@/hooks/api/use-schedule-analytics";
import { useScheduleHistory } from "@/hooks/api/use-schedules";
import { useHydrated } from "@/hooks/use-hydrated";
import { ApiError } from "@/types/api";

import { AnalyticsInsights } from "./analytics-insights";
import { DayDetail } from "./day-detail";
import {
  addDays,
  type CivilDate,
  daysInMonth,
  forecast,
  fromIsoDate,
  restrictedAt,
  todayIn,
  toIsoDate,
  weekday,
} from "./forecast";
import { formatClock, formatDayLong, formatDayShort, formatHours, formatMonth, formatVehicles } from "./format";
import {
  type MetricDef,
  PLANNED_METRICS,
  type PlannedMetric,
  REAL_METRICS,
  type RealMetric,
  type Source,
} from "./metrics";
import { buildModel } from "./model";
import { MonthHeatmap } from "./month-heatmap";
import { RefusalReasons, ScheduleExecution, VehiclesToWatch } from "./real-breakdowns";
import { RealDayDetail } from "./real-day-detail";
import { RealKpis } from "./real-kpis";
import { ScheduleBreakdown } from "./schedule-breakdown";
import { WeekHeatmap } from "./week-heatmap";

const GRID_DAYS = 42;

/** Horloge à la minute : « immobilisés maintenant » et l'heure en cours suivent le temps. */
function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function monthOf(value: string | null): CivilDate | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  const date = fromIsoDate(`${value}-01`);
  return date;
}

/**
 * Calendrier & analyses de l'immobilisation planifiée, deux sources :
 *
 *   PRÉVU  calculé dans le navigateur à partir des calendriers actifs, de leurs
 *          rattachements et des flottes, avec la règle du moteur ;
 *   RÉEL   historique du moteur agrégé par le back-end
 *          (GET /admin/usage-schedules/analytics) : commandes et leur issue,
 *          refus avant émission, dérogations, délais.
 *
 * Le prévu reste calculé en mode réel : il donne les transitions attendues
 * du jour sélectionné, à comparer aux commandes émises et confirmées.
 *
 * État dans l'URL (`source`, `mois`, `jour`) : la vue se partage et survit au retour.
 */
export function ScheduleAnalytics({ onCreate }: { onCreate: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [plannedMetric, setPlannedMetric] = useState<PlannedMetric>("vehicleHours");
  const [realMetric, setRealMetric] = useState<RealMetric>("confirmedCuts");
  const source: Source = searchParams.get("source") === "reel" ? "reel" : "prevu";
  const now = useNow();
  /**
   * La barre d'outils affiche le mois courant (horloge + formatage Intl) :
   * serveur et navigateur ne lisent pas l'heure au même instant, et Node et le
   * navigateur n'ont pas toujours les mêmes données Intl. Rien de tout cela
   * n'est rendu avant la fin de l'hydratation → aucun écart SSR possible.
   */
  const hydrated = useHydrated();

  const analytics = useScheduleAnalyticsData(organizationId);
  const model = useMemo(() => (analytics.data ? buildModel(analytics.data) : null), [analytics.data]);
  const displayTz = model?.displayTz ?? "Africa/Abidjan";
  const today = todayIn(displayTz, now);
  const todayIso = toIsoDate(today);

  const month = monthOf(searchParams.get("mois")) ?? { y: today.y, m: today.m, d: 1 };
  const monthKey = toIsoDate(month).slice(0, 7);
  const requestedDay = searchParams.get("jour");
  const selected =
    requestedDay?.startsWith(monthKey) && fromIsoDate(requestedDay)
      ? requestedDay
      : todayIso.startsWith(monthKey)
        ? todayIso
        : `${monthKey}-01`;

  const from = addDays(month, -((weekday(month) + 6) % 7));
  const fromKey = toIsoDate(from);
  const monthEnd = `${monthKey}-${String(daysInMonth(month.y, month.m)).padStart(2, "0")}`;

  // Réel : le mois pour les indicateurs et tableaux, les 6 semaines de la grille pour les cases.
  const isReal = source === "reel";
  const historyMonth = useScheduleHistory(
    { organizationId, from: `${monthKey}-01`, to: monthEnd, timezone: displayTz },
    { enabled: isReal && Boolean(model) },
  );
  const historyGrid = useScheduleHistory(
    { organizationId, from: fromKey, to: toIsoDate(addDays(from, GRID_DAYS - 1)), timezone: displayTz },
    { enabled: isReal && Boolean(model) },
  );

  const result = useMemo(
    () =>
      model ? forecast(model.vehicles, { displayTz, from: fromIsoDate(fromKey) as CivilDate, days: GRID_DAYS }) : null,
    [model, displayTz, fromKey],
  );
  const restrictedNow = useMemo(() => (model ? restrictedAt(model.vehicles, now) : []), [model, now]);

  function setParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  const goToMonth = (date: CivilDate, day?: string) => {
    const key = toIsoDate(date).slice(0, 7);
    setParams({ mois: key, jour: day ?? (todayIso.startsWith(key) ? todayIso : `${key}-01`) });
  };
  const selectDay = (iso: string) => {
    if (iso.startsWith(monthKey)) setParams({ jour: iso });
    else goToMonth(fromIsoDate(`${iso.slice(0, 7)}-01`) as CivilDate, iso);
  };

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Mois précédent"
          onClick={() => goToMonth(addDays(month, -1))}
        >
          <ChevronLeft />
        </Button>
        <h2 className="min-w-36 text-center font-medium text-lg capitalize" aria-live="polite">
          {formatMonth(month)}
        </h2>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Mois suivant"
          onClick={() => goToMonth(addDays(month, daysInMonth(month.y, month.m)))}
        >
          <ChevronRight />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => goToMonth({ ...today, d: 1 }, todayIso)}>
          Aujourd'hui
        </Button>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={source}
          onValueChange={(v) => v && setParams({ source: v === "reel" ? "reel" : null })}
          aria-label="Source des données"
        >
          <ToggleGroupItem value="prevu" className="px-3">
            Prévu
          </ToggleGroupItem>
          <ToggleGroupItem value="reel" className="px-3">
            Réel
          </ToggleGroupItem>
        </ToggleGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex text-muted-foreground"
              aria-label="Différence entre prévu et réel"
            >
              <Info className="size-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-80">
            {isReal
              ? "Historique du moteur planifié : commandes émises et confirmées par les boîtiers, tentatives refusées par les garde-fous, dérogations des opérateurs."
              : "Calculé à partir des calendriers actifs et de leurs rattachements, avec la règle du moteur. Ce n'est pas l'historique : un véhicule en mouvement ou sans relais est coupé plus tard, ou pas du tout."}
          </TooltipContent>
        </Tooltip>
        <span className="text-muted-foreground text-xs">Heures : {displayTz}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <OrganizationFilter value={organizationId} onChange={setOrganizationId} />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            analytics.refetch();
            if (isReal) {
              void historyMonth.refetch();
              void historyGrid.refetch();
            }
          }}
          disabled={analytics.isFetching || historyMonth.isFetching || historyGrid.isFetching}
          aria-label="Actualiser"
        >
          <RefreshCw
            className={
              analytics.isFetching || historyMonth.isFetching || historyGrid.isFetching
                ? "animate-spin motion-reduce:animate-none"
                : undefined
            }
          />
        </Button>
      </div>
    </div>
  );

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-9 w-full max-w-xl rounded-md" />
        <div className={metricGridClass}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={String(i)} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Skeleton className="h-[34rem] rounded-xl" />
          <Skeleton className="h-[34rem] rounded-xl" />
        </div>
      </div>
    );
  }

  if (analytics.isError) {
    return (
      <div className="flex flex-col gap-4">
        {toolbar}
        <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} />
      </div>
    );
  }

  if (!model || !result || !analytics.data) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        {toolbar}
        <div className={metricGridClass}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={String(i)} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Skeleton className="h-[34rem] rounded-xl" />
          <Skeleton className="h-[34rem] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isReal && analytics.data.schedules.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {toolbar}
        <EmptyState
          icon={<CalendarClock />}
          title="Aucun calendrier actif"
          description="Le calendrier et les analyses se remplissent dès qu'un calendrier actif est rattaché à des véhicules ou à une flotte."
          action={<Button onClick={onCreate}>Créer un calendrier</Button>}
        />
      </div>
    );
  }

  const monthDays = result.days.filter((d) => d.date.startsWith(monthKey));
  const day = result.days.find((d) => d.date === selected) ?? monthDays[0];
  const weekIndex = Math.floor(result.days.indexOf(day) / 7);
  const weekDays = result.days.slice(weekIndex * 7, weekIndex * 7 + 7);
  const monthHours = monthDays.reduce((s, d) => s + d.vehicleHours, 0);
  const peakDay = monthDays.reduce((best, d) => (d.peak > best.peak ? d : best), monthDays[0]);
  const total = analytics.data.vehiclesTotal;
  const coverage = total ? Math.round((result.managed / total) * 100) : null;
  const multiOrg = !organizationId;
  const monthLabel = formatMonth(month).split(" ")[0];

  if (isReal) {
    if (historyMonth.isError || historyGrid.isError) {
      const failure = historyMonth.error ?? historyGrid.error;
      // 404 : le back-end n'a pas encore l'endpoint d'analyse (migration 020 non déployée).
      if (failure instanceof ApiError && failure.status === 404) {
        return (
          <div className="flex flex-col gap-4">
            {toolbar}
            <EmptyState
              icon={<Info />}
              title="Historique réel indisponible sur ce serveur"
              description="Le back-end ne propose pas encore GET /admin/usage-schedules/analytics. Déployez la mise à jour du back-end (migration 020) pour afficher l'historique ; la vue « Prévu » reste disponible."
              action={
                <Button variant="outline" onClick={() => setParams({ source: null })}>
                  Revenir au prévu
                </Button>
              }
            />
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-4">
          {toolbar}
          <ErrorState
            error={historyMonth.error ?? historyGrid.error}
            onRetry={() => {
              void historyMonth.refetch();
              void historyGrid.refetch();
            }}
          />
        </div>
      );
    }
    if (!historyMonth.data || !historyGrid.data) {
      return (
        <div className="flex flex-col gap-4" aria-busy="true">
          {toolbar}
          <div className={metricGridClass}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={String(i)} className="h-36 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
            <Skeleton className="h-[34rem] rounded-xl" />
            <Skeleton className="h-[34rem] rounded-xl" />
          </div>
        </div>
      );
    }

    const grid = historyGrid.data;
    const realMeta: MetricDef<(typeof grid.days)[number]> = REAL_METRICS[realMetric];
    const realDay = grid.days.find((d) => d.date === day.date) ?? grid.days[0];
    const realWeek = grid.days.slice(weekIndex * 7, weekIndex * 7 + 7).map((d) => ({
      date: d.date,
      hours: d.hours.cut.map((c, h) => c + (d.hours.restore[h] ?? 0)),
    }));
    const since = historyMonth.data.journalSince;
    const partialJournal = !since || since.slice(0, 10) > `${monthKey}-01`;

    return (
      <div className="flex flex-col gap-4">
        {toolbar}

        {partialJournal ? (
          <Alert>
            <Info />
            <AlertDescription>
              {since
                ? `Refus, dérogations et délais sont journalisés depuis le ${formatDayLong(since.slice(0, 10))}. Avant, seules les commandes émises et leur issue sont connues.`
                : "Le journal d'exécution est vide pour l'instant : seules les commandes émises et leur issue sont connues. Refus, dérogations et délais apparaîtront au fil des passages du moteur."}
            </AlertDescription>
          </Alert>
        ) : null}

        <RealKpis history={historyMonth.data} monthLabel={monthLabel} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="size-4 text-muted-foreground" aria-hidden="true" />
                Calendrier du mois — réel
              </CardTitle>
              <CardDescription>
                Activité du moteur planifié jour par jour. Choisissez un jour pour comparer le prévu, l'émis et le
                confirmé.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={realMetric}
                onValueChange={(v) => v && setRealMetric(v as RealMetric)}
                aria-label="Indicateur affiché dans le calendrier"
                className="flex-wrap"
              >
                {(Object.keys(REAL_METRICS) as RealMetric[]).map((k) => (
                  <ToggleGroupItem key={k} value={k} className="px-3">
                    {REAL_METRICS[k].label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <MonthHeatmap
                days={grid.days.map((d) => ({ date: d.date, value: realMeta.value(d) }))}
                month={monthKey}
                meta={realMeta}
                selected={day.date}
                today={todayIso}
                onSelect={selectDay}
              />
            </CardContent>
          </Card>

          <RealDayDetail day={realDay} planned={day} />
        </div>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>
              Semaine du {formatDayShort(weekDays[0].date)} au {formatDayShort(weekDays[6].date)} — réel
            </CardTitle>
            <CardDescription>
              Commandes émises par le moteur (coupures et rétablissements), heure par heure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeekHeatmap
              days={realWeek}
              unit="Commandes émises par le moteur"
              integer
              format={formatVehicles}
              selected={day.date}
              onSelect={selectDay}
            />
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <RefusalReasons history={historyMonth.data} />
          <VehiclesToWatch history={historyMonth.data} />
        </div>

        <ScheduleExecution history={historyMonth.data} />
      </div>
    );
  }

  const plannedMeta = PLANNED_METRICS[plannedMetric];

  return (
    <div className="flex flex-col gap-4">
      {toolbar}

      <div className={metricGridClass}>
        <MetricCard
          icon={ShieldCheck}
          label="Véhicules sous calendrier"
          value={result.managed}
          badge={
            coverage !== null ? (
              <StatusBadge tone="info" dot={false}>
                {coverage} % du parc
              </StatusBadge>
            ) : null
          }
          hint={total !== null ? `Sur ${total} véhicule(s) dans le périmètre.` : "Directement ou par une flotte."}
        />
        <MetricCard
          icon={PowerOff}
          label="Immobilisés maintenant (prévu)"
          value={restrictedNow.length}
          hint={`Selon les plages en cours à ${formatClock(now, displayTz)} — actualisé chaque minute.`}
        />
        <MetricCard
          icon={Clock3}
          label={`Heures-véhicule en ${monthLabel}`}
          value={formatHours(monthHours)}
          hint={
            result.managed > 0
              ? `≈ ${formatHours(monthHours / result.managed / monthDays.length)} par véhicule et par jour.`
              : "Aucun véhicule rattaché."
          }
        />
        <MetricCard
          icon={TrendingUp}
          label="Pic simultané du mois"
          value={formatVehicles(peakDay?.peak ?? 0)}
          hint={
            peakDay && peakDay.peak > 0 && peakDay.peakAt !== null
              ? `Le ${formatDayLong(peakDay.date)} à ${formatClock(peakDay.peakAt, displayTz)}.`
              : "Aucune immobilisation prévue ce mois-ci."
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" aria-hidden="true" />
              Calendrier du mois
            </CardTitle>
            <CardDescription>
              Chaque case résume la journée. Choisissez un jour (clic ou flèches du clavier) pour voir son profil heure
              par heure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={plannedMetric}
              onValueChange={(v) => v && setPlannedMetric(v as PlannedMetric)}
              aria-label="Indicateur affiché dans le calendrier"
              className="flex-wrap"
            >
              {(Object.keys(PLANNED_METRICS) as PlannedMetric[]).map((k) => (
                <ToggleGroupItem key={k} value={k} className="px-3">
                  {PLANNED_METRICS[k].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <MonthHeatmap
              days={result.days.map((d) => ({ date: d.date, value: plannedMeta.value(d) }))}
              month={monthKey}
              meta={plannedMeta}
              selected={day.date}
              today={todayIso}
              onSelect={selectDay}
            />
          </CardContent>
        </Card>

        <DayDetail day={day} stats={model.stats} displayTz={displayTz} now={now} />
      </div>

      <Card className="min-w-0">
        <CardHeader className="border-b">
          <CardTitle>
            Semaine du {formatDayShort(weekDays[0].date)} au {formatDayShort(weekDays[6].date)}
          </CardTitle>
          <CardDescription>
            Heure par heure : où se concentrent les immobilisations. Cliquez un jour pour le détailler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeekHeatmap
            days={weekDays}
            unit="Véhicules immobilisés (moyenne sur l'heure)"
            format={formatVehicles}
            selected={day.date}
            onSelect={selectDay}
          />
        </CardContent>
      </Card>

      <AnalyticsInsights
        model={model}
        alwaysRestricted={result.alwaysRestricted}
        inactiveTotal={analytics.data.inactiveTotal}
        truncated={analytics.data.truncated}
      />

      <ScheduleBreakdown stats={model.stats} showOrganization={multiOrg} />
    </div>
  );
}
