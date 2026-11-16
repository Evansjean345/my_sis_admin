"use client";

import Link from "next/link";

import { cn } from "cn";
import { ExternalLink, Gauge, KeyRound, MapPin, Route, Timer, TriangleAlert, X } from "lucide-react";

import { ErrorState } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Checkbox } from "@shared/components/ui/checkbox";
import { Field, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { Separator } from "@shared/components/ui/separator";
import { Skeleton } from "@shared/components/ui/skeleton";
import { FLEET_STATE_META, fleetState } from "@shared/features/fleet/fleet-state";
import { type ReplayState, TripReplay } from "@shared/features/fleet/trip-replay";
import { PERIOD_LABELS, type TrackPeriod } from "@shared/features/fleet/use-track-range";
import { formatDateTime, formatNumber, formatRelative, toNumber } from "@shared/lib/format";
import { formatDuration } from "@shared/lib/track";
import type { TrackPoint, TrackSummary } from "@shared/types/track";
import type { VehicleDetail } from "@shared/types/vehicle";

interface VehicleTripPanelProps {
  vehicle: VehicleDetail;
  period: TrackPeriod;
  onPeriodChange: (p: TrackPeriod) => void;
  day: string;
  onDayChange: (d: string) => void;
  onlyValidFix: boolean;
  onOnlyValidFixChange: (v: boolean) => void;
  points: TrackPoint[];
  summary: TrackSummary | null;
  loading: boolean;
  fetching: boolean;
  error: unknown;
  onRetry: () => void;
  replay: ReplayState;
  onReplayChange: (r: ReplayState) => void;
  onClose?: () => void;
  className?: string;
}

function Stat({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className={cn("font-medium text-sm tabular-nums", danger && "text-destructive")}>{value}</span>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-primary" /> Trajet
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-red-500" /> Survitesse
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-4 rounded-full bg-sky-400" /> Lent / arrêt
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex size-3.5 items-center justify-center rounded-sm bg-amber-500 font-bold text-[8px] text-white">
          P
        </span>
        Arrêt &gt; 5 min
      </span>
    </div>
  );
}

export function VehicleTripPanel(props: VehicleTripPanelProps) {
  const { vehicle, summary } = props;
  const state = fleetState(vehicle);
  const meta = FLEET_STATE_META[state];
  const p = vehicle.lastPosition;
  const limit = toNumber(vehicle.speedLimitKph);

  return (
    <Card size="sm" className={cn("gap-3 shadow-lg", props.className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {vehicle.registration}
          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
        </CardTitle>
        <CardDescription>
          {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" · ") || "—"}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" asChild aria-label="Ouvrir la fiche du véhicule">
            <Link href={`/dashboard/vehicles/${vehicle.id}`} prefetch={false}>
              <ExternalLink />
            </Link>
          </Button>
          {props.onClose ? (
            <Button size="icon-sm" variant="ghost" aria-label="Fermer" onClick={props.onClose}>
              <X />
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            icon={Gauge}
            label="Vitesse"
            value={p ? `${formatNumber(p.speedKph, 0)} km/h` : "—"}
            danger={Boolean(p && limit !== null && (toNumber(p.speedKph) ?? 0) > limit)}
          />
          <Stat icon={KeyRound} label="Contact" value={p?.ignition == null ? "—" : p.ignition ? "Allumé" : "Coupé"} />
          <Stat icon={MapPin} label="Position" value={p ? formatRelative(p.recordedAt) : "aucune"} />
        </div>

        {!vehicle.device ? (
          <Alert>
            <TriangleAlert className="size-4" />
            <AlertDescription>Aucun tracker monté : trajet indisponible.</AlertDescription>
          </Alert>
        ) : (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-medium text-sm">
                  <Route className="size-4" />
                  Trajet effectué
                </span>
                <Select value={props.period} onValueChange={(v) => props.onPeriodChange(v as TrackPeriod)}>
                  <SelectTrigger size="sm" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    <SelectGroup>
                      {(Object.keys(PERIOD_LABELS) as TrackPeriod[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {PERIOD_LABELS[key]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {props.period === "day" ? (
                <Input
                  type="date"
                  aria-label="Jour du trajet"
                  value={props.day}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => props.onDayChange(e.target.value)}
                />
              ) : null}
              <Field orientation="horizontal">
                <Checkbox
                  id="only-valid-fix"
                  checked={props.onlyValidFix}
                  onCheckedChange={(v) => props.onOnlyValidFixChange(Boolean(v))}
                />
                <FieldLabel htmlFor="only-valid-fix" className="font-normal text-xs">
                  Ignorer les points sans fix GPS valide
                </FieldLabel>
              </Field>
            </div>

            {props.loading ? (
              <Skeleton className="h-24 w-full" />
            ) : props.error ? (
              <ErrorState error={props.error} onRetry={props.onRetry} title="Trajet indisponible" />
            ) : !summary || summary.points < 2 ? (
              <p className="rounded-lg border border-dashed p-3 text-center text-muted-foreground text-sm">
                Aucun déplacement enregistré sur cette période.
              </p>
            ) : (
              <>
                <div className={cn("grid grid-cols-3 gap-3", props.fetching && "opacity-60")}>
                  <Stat icon={Route} label="Distance" value={`${formatNumber(summary.distanceKm, 1)} km`} />
                  <Stat icon={Timer} label="En mouvement" value={formatDuration(summary.movingMs)} />
                  <Stat icon={Timer} label="Durée totale" value={formatDuration(summary.durationMs)} />
                  <Stat
                    icon={Gauge}
                    label="Vitesse max"
                    value={`${formatNumber(summary.maxSpeed, 0)} km/h`}
                    danger={limit !== null && summary.maxSpeed > limit}
                  />
                  <Stat icon={Gauge} label="Moyenne" value={`${formatNumber(summary.avgMovingSpeed, 0)} km/h`} />
                  <Stat
                    icon={TriangleAlert}
                    label={`Survitesses${limit !== null ? ` (>${formatNumber(limit)})` : ""}`}
                    value={String(summary.overspeedCount)}
                    danger={summary.overspeedCount > 0}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {summary.points} points · du {formatDateTime(summary.start?.ts)} au {formatDateTime(summary.end?.ts)}
                </p>
                <Legend />
                <TripReplay points={props.points} state={props.replay} onChange={props.onReplayChange} />
                {summary.stops.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    <span className="font-medium text-sm">Arrêts ({summary.stops.length})</span>
                    <ul className="flex max-h-40 flex-col divide-y overflow-auto rounded-lg border">
                      {summary.stops.map((s) => (
                        <li key={s.from} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
                          <span className="tabular-nums">{formatDateTime(s.from)}</span>
                          <span className="font-medium">{formatDuration(s.duration)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
