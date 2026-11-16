"use client";

import { useMemo, useState } from "react";

import { BatteryMedium, Gauge, Key, MapPin, Plug, RefreshCw, Satellite, Search, Signal } from "lucide-react";

import { MetricCard, metricGridClass } from "@shared/components/metric-card";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { useDeviceTelemetry } from "@shared/hooks/api/use-devices";
import { formatDateTime, formatNumber, formatRelative, fromFlespiTs } from "@shared/lib/format";
import type { DeviceTelemetry, TelemetryValue } from "@shared/types/device";

function read<T extends TelemetryValue>(t: DeviceTelemetry, key: string): T | null {
  return (t[key]?.value as T | undefined) ?? null;
}

function renderValue(value: TelemetryValue): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const ALARM_KEYS = [
  ["power.cut.alarm", "Coupure d'alimentation"],
  ["shutdown.alarm", "Arrêt"],
  ["vibration.alarm", "Vibration"],
  ["overspeeding.event", "Survitesse"],
  ["movement.event", "Mouvement"],
] as const;

export function TelemetryTab({ deviceId }: { deviceId: string }) {
  const telemetry = useDeviceTelemetry(deviceId);
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const entries = Object.entries(telemetry.data ?? {}).sort(([a], [b]) => a.localeCompare(b));
    const q = filter.trim().toLowerCase();
    return q ? entries.filter(([k]) => k.toLowerCase().includes(q)) : entries;
  }, [telemetry.data, filter]);

  if (telemetry.isPending) return <LoadingRows rows={6} />;
  if (telemetry.isError) return <ErrorState error={telemetry.error} onRetry={() => telemetry.refetch()} />;

  const t = telemetry.data;
  const lastTs = read<number>(t, "timestamp");
  const battery = read<number>(t, "battery.level");
  const voltage = read<number>(t, "external.powersource.voltage");
  const gsm = read<number>(t, "gsm.signal.dbm") ?? read<number>(t, "gsm.signal.level");
  const satellites = read<number>(t, "position.satellites");
  const speed = read<number>(t, "position.speed");
  const ignition = read<boolean>(t, "engine.ignition.status");
  const mileage = read<number>(t, "vehicle.mileage");
  const lat = read<number>(t, "position.latitude");
  const lng = read<number>(t, "position.longitude");
  const valid = read<boolean>(t, "position.valid");
  const activeAlarms = ALARM_KEYS.filter(([key]) => read<boolean>(t, key) === true);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Dernière trame : {formatDateTime(fromFlespiTs(lastTs))} ({formatRelative(fromFlespiTs(lastTs))}) · rafraîchi
          toutes les 30 s
        </p>
        <Button size="sm" variant="outline" onClick={() => telemetry.refetch()} disabled={telemetry.isFetching}>
          <RefreshCw data-icon="inline-start" className={telemetry.isFetching ? "animate-spin" : undefined} />
          Actualiser
        </Button>
      </div>

      <div className={metricGridClass}>
        <MetricCard
          icon={Gauge}
          label="Vitesse"
          value={`${formatNumber(speed, 1)} km/h`}
          hint={mileage !== null ? `Compteur : ${formatNumber(mileage)} km` : undefined}
        />
        <MetricCard
          icon={Key}
          label="Contact"
          value={ignition === null ? "—" : ignition ? "Allumé" : "Coupé"}
          badge={
            ignition === null ? null : (
              <StatusBadge tone={ignition ? "success" : "neutral"}>{ignition ? "ON" : "OFF"}</StatusBadge>
            )
          }
        />
        <MetricCard
          icon={BatteryMedium}
          label="Batterie interne"
          value={battery === null ? "—" : `${battery} %`}
          hint={voltage !== null ? `Alimentation externe : ${formatNumber(voltage, 1)} V` : undefined}
        />
        <MetricCard
          icon={Signal}
          label="Réseau GSM"
          value={gsm === null ? "—" : String(gsm)}
          hint={`MCC ${renderValue(read(t, "gsm.mcc"))} · MNC ${renderValue(read(t, "gsm.mnc"))}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Position
            </CardTitle>
            <CardDescription>
              <Satellite className="mr-1 inline size-3.5" />
              {satellites ?? "—"} satellites ·{" "}
              {valid === null ? "validité inconnue" : valid ? "fix valide" : "fix invalide"}
            </CardDescription>
          </CardHeader>
          <CardContent className="font-mono text-sm">
            {lat !== null && lng !== null ? (
              <a
                className="hover:underline"
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                target="_blank"
                rel="noreferrer"
              >
                {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
              </a>
            ) : (
              "—"
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="size-4" />
              Alarmes et événements
            </CardTitle>
            <CardDescription>Derniers indicateurs remontés par le boîtier.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {activeAlarms.length === 0 ? (
              <span className="text-muted-foreground text-sm">Aucune alarme active.</span>
            ) : (
              activeAlarms.map(([key, label]) => (
                <StatusBadge key={key} tone="danger" className="gap-1.5">
                  {label} · {formatRelative(fromFlespiTs(t[key]?.ts))}
                </StatusBadge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Tous les paramètres</CardTitle>
          <CardDescription>{Object.keys(t).length} paramètres — dernière valeur connue chez flespi.</CardDescription>
          <CardAction>
            <InputGroup className="h-7 w-48 sm:w-64">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Filtrer…"
                aria-label="Filtrer les paramètres"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </InputGroup>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <div className="max-h-[480px] overflow-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Paramètre</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead className="hidden sm:table-cell">Horodatage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([key, entry]) => (
                  <TableRow key={key}>
                    <TableCell className="font-mono text-xs">{key}</TableCell>
                    <TableCell className="max-w-80 truncate font-mono text-xs" title={renderValue(entry.value)}>
                      {renderValue(entry.value)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs tabular-nums sm:table-cell">
                      {formatDateTime(fromFlespiTs(entry.ts))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
