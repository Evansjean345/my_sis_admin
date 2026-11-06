import Link from "next/link";

import { OrganizationCell } from "@/app/(main)/dashboard/_components/organization/organization-select";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ModeBadge } from "../../../_components/schedules/schedule-badges";
import { WeekPreview } from "../../../_components/schedules/week-preview";
import { weeklyRestrictedHours } from "./forecast";
import { formatHours } from "./format";
import type { ScheduleStat } from "./model";

/**
 * Poids de chaque calendrier, pris isolément : heures d'immobilisation par
 * semaine qu'il impose × véhicules couverts. Sert à repérer le calendrier
 * qui pèse le plus sur l'exploitation, ou celui qui ne sert à rien.
 */
export function ScheduleBreakdown({ stats, showOrganization }: { stats: ScheduleStat[]; showOrganization: boolean }) {
  const max = Math.max(1, ...stats.map((s) => s.vehicleHoursAlone));

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Poids des calendriers</CardTitle>
        <CardDescription>
          Heures-véhicule d'immobilisation par semaine imposées par chaque calendrier, pris isolément. Plusieurs
          calendriers sur un même véhicule ne s'additionnent pas : le moteur applique le plus restrictif.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Calendrier</TableHead>
              {showOrganization ? <TableHead className="hidden md:table-cell">Organisation</TableHead> : null}
              <TableHead className="hidden lg:table-cell">Semaine</TableHead>
              <TableHead className="hidden sm:table-cell">Rattachements</TableHead>
              <TableHead className="text-right">Véhicules</TableHead>
              <TableHead className="hidden text-right md:table-cell">Immobilisation / véh.</TableHead>
              <TableHead className="min-w-40 pr-6">Heures-véhicule / semaine</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((s) => {
              const modes = (["allowed", "forbidden"] as const).filter((m) => s.vehiclesByMode[m] > 0);
              return (
                <TableRow key={s.schedule.id}>
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/dashboard/clock/${s.schedule.id}`}
                        prefetch={false}
                        className="font-medium hover:underline"
                      >
                        {s.schedule.name}
                      </Link>
                      <div className="flex flex-wrap gap-1">
                        {s.permanent ? (
                          <StatusBadge tone="danger" dot={false}>
                            Aucune plage autorisée
                          </StatusBadge>
                        ) : null}
                        {s.withoutEffect ? (
                          <StatusBadge tone="neutral" dot={false}>
                            Sans effet
                          </StatusBadge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  {showOrganization ? (
                    <TableCell className="hidden md:table-cell">
                      <OrganizationCell organization={s.schedule.organization ?? null} />
                    </TableCell>
                  ) : null}
                  <TableCell className="hidden w-40 lg:table-cell">
                    <WeekPreview windows={s.schedule.windows} compact />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap gap-1">
                        {modes.map((m) => (
                          <ModeBadge key={m} mode={m} />
                        ))}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {s.directCount} véh. direct(s) · {s.groupCount} flotte(s)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.vehiclesCovered}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular-nums md:table-cell">
                    {modes.length === 0
                      ? "—"
                      : modes.map((m) => formatHours(weeklyRestrictedHours(s.schedule.windows, m))).join(" / ")}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-muted-foreground/10"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-[#2a78d6] dark:bg-[#3987e5]"
                          style={{ width: `${(s.vehicleHoursAlone / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right font-medium tabular-nums">
                        {formatHours(s.vehicleHoursAlone)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
