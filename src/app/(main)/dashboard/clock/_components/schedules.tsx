"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  CalendarClock,
  CalendarOff,
  ChartColumn,
  List,
  Plus,
  RefreshCw,
  Search,
  SquareParking,
  Truck,
} from "lucide-react";

import {
  OrganizationCell,
  OrganizationFilter,
} from "@/app/(main)/dashboard/_components/organization/organization-select";
import { MetricCard, metricGridClass } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchedules } from "@/hooks/api/use-schedules";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatDate } from "@/lib/format";

import { WeekPreview } from "../../_components/schedules/week-preview";
import { weeklyHours } from "../../_components/schedules/week-utils";
import { ScheduleAnalytics } from "./analytics/schedule-analytics";
import { ScheduleFormDialog } from "./schedule-form-dialog";
import { ScheduleRowActions } from "./schedule-row-actions";

type ActiveFilter = "all" | "active" | "inactive";
type ClockView = "calendriers" | "analyses";

/**
 * Gestion des horaires — calendriers d'utilisation de toutes les organisations.
 *
 * Un calendrier rattaché à un véhicule ou à une flotte est appliqué par le
 * moteur `sisbm:schedules:enforce` : coupure hors des plages autorisées (ou
 * pendant les plages interdites), rétablissement à la réouverture.
 */
export function Schedules() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: ClockView = searchParams.get("vue") === "analyses" ? "analyses" : "calendriers";
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<ActiveFilter>("all");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const schedules = useSchedules({
    page,
    perPage,
    search: debouncedSearch || undefined,
    isActive: active === "all" ? undefined : active === "active",
    organizationId,
  });
  const rows = schedules.data?.data ?? [];
  const total = schedules.data?.meta.total ?? 0;
  const actifs = rows.filter((s) => s.isActive).length;
  const vehicules = rows.reduce((sum, s) => sum + (s.vehiclesCount ?? 0), 0);
  const flottes = rows.reduce((sum, s) => sum + (s.vehicleGroupsCount ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Gestion des horaires"
        description="Calendriers d'utilisation : le moteur planifié immobilise les véhicules hors de leurs plages et les rétablit à la réouverture."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Nouveau calendrier
          </Button>
        }
      />

      <Tabs
        value={view}
        onValueChange={(value) =>
          router.replace(value === "analyses" ? `${pathname}?vue=analyses` : pathname, { scroll: false })
        }
      >
        <TabsList>
          <TabsTrigger value="calendriers">
            <List data-icon="inline-start" />
            Calendriers
          </TabsTrigger>
          <TabsTrigger value="analyses">
            <ChartColumn data-icon="inline-start" />
            Calendrier &amp; analyses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="pt-2">
          <ScheduleAnalytics onCreate={() => setCreateOpen(true)} />
        </TabsContent>

        <TabsContent value="calendriers" className="flex flex-col gap-4 pt-2">
          <div className={metricGridClass}>
            <MetricCard icon={CalendarClock} label="Calendriers" value={total} hint="Selon les filtres en cours." />
            <MetricCard
              icon={CalendarOff}
              label="Actifs (page)"
              value={actifs}
              hint="Un calendrier inactif est ignoré par le moteur."
            />
            <MetricCard
              icon={Truck}
              label="Véhicules rattachés (page)"
              value={vehicules}
              hint="Rattachements directs."
            />
            <MetricCard
              icon={SquareParking}
              label="Flottes rattachées (page)"
              value={flottes}
              hint="Tous les véhicules de la flotte suivent le calendrier."
            />
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <InputGroup className="md:max-w-lg">
              <InputGroupInput
                placeholder="Rechercher un calendrier…"
                aria-label="Rechercher un calendrier"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
            <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
              <OrganizationFilter
                value={organizationId}
                onChange={(id) => {
                  setOrganizationId(id);
                  setPage(1);
                }}
              />
              <Select
                value={active}
                onValueChange={(v) => {
                  setActive(v as ActiveFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm">
                  <span className="text-muted-foreground">État :</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectGroup>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="inactive">Inactifs</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => schedules.refetch()} disabled={schedules.isFetching}>
                <RefreshCw data-icon="inline-start" className={schedules.isFetching ? "animate-spin" : undefined} />
                Actualiser
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="px-0">
              {schedules.isPending ? (
                <LoadingRows rows={6} />
              ) : schedules.isError ? (
                <div className="px-4">
                  <ErrorState error={schedules.error} onRetry={() => schedules.refetch()} />
                </div>
              ) : rows.length === 0 ? (
                <div className="px-4">
                  <EmptyState
                    icon={<CalendarClock />}
                    title="Aucun calendrier"
                    description={
                      debouncedSearch
                        ? "Aucun résultat pour cette recherche."
                        : "Créez un calendrier (heures de service, couvre-feu…) puis rattachez-le à des véhicules ou à des flottes."
                    }
                    action={
                      <Button size="sm" onClick={() => setCreateOpen(true)}>
                        <Plus data-icon="inline-start" />
                        Nouveau calendrier
                      </Button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Calendrier</TableHead>
                          <TableHead className="hidden md:table-cell">Organisation</TableHead>
                          <TableHead className="hidden lg:table-cell">Semaine</TableHead>
                          <TableHead className="hidden sm:table-cell">Rattachements</TableHead>
                          <TableHead>État</TableHead>
                          <TableHead className="hidden xl:table-cell">Modifié le</TableHead>
                          <TableHead className="w-12">
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>
                              <Link
                                href={`/dashboard/clock/${s.id}`}
                                prefetch={false}
                                className="flex flex-col hover:underline"
                              >
                                <span className="font-medium">{s.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  {s.timezone} · {weeklyHours(s.windows)} h / semaine
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell className="hidden max-w-48 md:table-cell">
                              <OrganizationCell organization={s.organization} />
                            </TableCell>
                            <TableCell className="hidden w-64 lg:table-cell">
                              <WeekPreview windows={s.windows} compact />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-col text-sm">
                                <span>{s.vehiclesCount ?? 0} véhicule(s)</span>
                                <span className="text-muted-foreground text-xs">
                                  {s.vehicleGroupsCount ?? 0} flotte(s)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge tone={s.isActive ? "success" : "neutral"}>
                                {s.isActive ? "Actif" : "Inactif"}
                              </StatusBadge>
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground xl:table-cell">
                              {formatDate(s.updatedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <ScheduleRowActions schedule={s} />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationBar
                    meta={schedules.data?.meta}
                    perPage={perPage}
                    label="calendriers"
                    onPageChange={setPage}
                    onPerPageChange={(n) => {
                      setPerPage(n);
                      setPage(1);
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ScheduleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultOrganizationId={organizationId}
        onCreated={(created) => router.push(`/dashboard/clock/${created.id}`)}
      />
    </div>
  );
}
