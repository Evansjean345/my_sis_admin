import Link from "next/link";

import { CircleCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { refusalLabels, type ScheduleHistory } from "@/types/schedule";

import { formatDuration, formatRate } from "./format";

/** Barre de proportion : décorative, le nombre est toujours écrit à côté. */
function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted-foreground/10" role="presentation">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

/** Pourquoi le moteur n'a pas pu émettre : garde-fous et configuration. */
export function RefusalReasons({ history }: { history: ScheduleHistory }) {
  const max = Math.max(0, ...history.refusalsByCode.map((r) => r.count));
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Motifs de refus</CardTitle>
        <CardDescription>
          Tentatives bloquées avant l'émission. Un véhicule en mouvement est réessayé chaque minute : un même épisode
          peut compter plusieurs tentatives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.refusalsByCode.length === 0 ? (
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Aucun refus sur la période.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.refusalsByCode.map((r) => (
              <li key={r.code} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{refusalLabels[r.code] ?? r.code}</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    <span className="font-semibold text-foreground">{r.count}</span> tentative(s) · {r.vehicles}{" "}
                    véhicule(s)
                  </span>
                </div>
                <Bar value={r.count} max={max} className="bg-[#eb6834] dark:bg-[#d95926]" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Les véhicules qui posent problème : échecs et refus d'abord. */
export function VehiclesToWatch({ history }: { history: ScheduleHistory }) {
  const rows = history.vehicles.filter((v) => v.failures + v.refusals + v.overrides > 0);
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Véhicules à surveiller</CardTitle>
        <CardDescription>Échecs, refus et dérogations sur la période (10 au plus).</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {rows.length === 0 ? (
          <p className="flex items-center gap-2 px-6 text-muted-foreground text-sm">
            <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Aucun véhicule en difficulté : toutes les commandes ont abouti.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Véhicule</TableHead>
                <TableHead className="text-right">Échecs</TableHead>
                <TableHead className="text-right">Refus</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Dérogations</TableHead>
                <TableHead className="hidden pr-6 text-right md:table-cell">Coupures / rétabl.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="pl-6">
                    <Link
                      href={`/dashboard/vehicles/${v.id}`}
                      prefetch={false}
                      className="font-medium font-mono hover:underline"
                    >
                      {v.registration ?? v.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {v.failures > 0 ? <span className="font-semibold text-destructive">{v.failures}</span> : 0}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{v.refusals}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{v.overrides}</TableCell>
                  <TableCell className="hidden pr-6 text-right text-muted-foreground tabular-nums md:table-cell">
                    {v.cuts} / {v.restores}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Exécution de chaque calendrier : de l'entrée en plage à la confirmation. */
export function ScheduleExecution({ history }: { history: ScheduleHistory }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Exécution par calendrier</CardTitle>
        <CardDescription>
          Entrées en plage d'immobilisation, commandes émises et confirmées, refus, dérogations et délai médian entre
          l'entrée en plage et la confirmation du boîtier.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {history.schedules.length === 0 ? (
          <p className="px-6 text-muted-foreground text-sm">
            Aucun événement journalisé sur la période pour l'instant.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Calendrier</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Entrées en plage</TableHead>
                <TableHead className="text-right">Émises</TableHead>
                <TableHead className="text-right">Confirmées</TableHead>
                <TableHead className="hidden text-right md:table-cell">Refus</TableHead>
                <TableHead className="hidden text-right md:table-cell">Dérogations</TableHead>
                <TableHead className="pr-6 text-right">Délai médian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-6">
                    <Link href={`/dashboard/clock/${s.id}`} prefetch={false} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {s.transitionsToImmobilized}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.dispatched}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="font-semibold">{s.acknowledged}</span>{" "}
                    <span className="text-muted-foreground text-xs">({formatRate(s.acknowledged, s.dispatched)})</span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{s.refusals}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{s.overrides}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">
                    {formatDuration(s.medianExecutionSeconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
