"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Contact, Download, Plus, RefreshCw, Search, Truck, UsersRound, UserX } from "lucide-react";

import { OrganizationCell } from "@/app/(main)/dashboard/_components/organization/organization-select";
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
import { useDrivers } from "@/hooks/api/use-drivers";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, formatDate } from "@/lib/format";
import { DRIVER_STATUSES, type DriverStatus, driverStatusMeta } from "@/types/driver";

import { DriverFormDialog } from "./driver-form-dialog";
import { DriverRowActions } from "./driver-row-actions";
import { ALL_ORGANIZATIONS, DriverOrganizationFilter, NO_ORGANIZATION } from "./driver-selects";
import { licenseState } from "./license-state";

const ALL = "all";

/**
 * Conducteurs de toutes les organisations, et vivier de l'exploitant
 * (conducteurs sans organisation).
 */
export function Drivers() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState(ALL_ORGANIZATIONS);
  const [status, setStatus] = useState<DriverStatus | typeof ALL>(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const organizationId =
    organization === ALL_ORGANIZATIONS || organization === NO_ORGANIZATION ? undefined : organization;
  const drivers = useDrivers({
    page,
    perPage,
    search: debouncedSearch || undefined,
    status: status === ALL ? undefined : status,
    organizationId,
    withoutOrganization: organization === NO_ORGANIZATION ? true : undefined,
  });
  const vivier = useDrivers({ page: 1, perPage: 1, withoutOrganization: true });

  const rows = drivers.data?.data ?? [];
  const total = drivers.data?.meta.total ?? 0;

  function exportCsv() {
    downloadCsv(
      `conducteurs-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((d) => ({
        nom: d.fullName,
        organisation: d.organization?.name ?? "vivier",
        matricule: d.employeeCode ?? "",
        telephone: d.phone ?? "",
        email: d.email ?? "",
        permis: d.licenseNumber ?? "",
        categories: d.licenseCategories.join(" "),
        permis_valable_jusqu_au: d.licenseExpiresOn ?? "",
        vehicule: d.vehicle?.registration ?? "",
        statut: driverStatusMeta[d.status]?.label ?? d.status,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Conducteurs"
        description="Conducteurs des organisations clientes et vivier de l'exploitant. Rattachez-les à une organisation, à un véhicule et à des équipes."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
              <Download data-icon="inline-start" />
              Exporter
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nouveau conducteur
            </Button>
          </>
        }
      />

      <div className={metricGridClass}>
        <MetricCard icon={Contact} label="Conducteurs" value={total} hint="Selon les filtres en cours." />
        <MetricCard
          icon={UsersRound}
          label="Actifs (page)"
          value={rows.filter((d) => d.status === "active").length}
          hint="Statut actif."
        />
        <MetricCard
          icon={Truck}
          label="Sans véhicule (page)"
          value={rows.filter((d) => !d.vehicleId).length}
          hint="Disponibles pour un rattachement."
        />
        <MetricCard
          icon={UserX}
          label="Vivier"
          value={vivier.data?.meta.total ?? "—"}
          hint="Conducteurs sans organisation."
        />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <InputGroup className="md:max-w-lg">
          <InputGroupInput
            placeholder="Nom, matricule ou n° de permis…"
            aria-label="Rechercher un conducteur"
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
          <DriverOrganizationFilter
            value={organization}
            onChange={(v) => {
              setOrganization(v);
              setPage(1);
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as DriverStatus | typeof ALL);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">Statut :</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                <SelectItem value={ALL}>Tous</SelectItem>
                {DRIVER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {driverStatusMeta[s].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => drivers.refetch()} disabled={drivers.isFetching}>
            <RefreshCw data-icon="inline-start" className={drivers.isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {drivers.isPending ? (
            <LoadingRows rows={6} />
          ) : drivers.isError ? (
            <div className="px-4">
              <ErrorState error={drivers.error} onRetry={() => drivers.refetch()} />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={<Contact />}
                title="Aucun conducteur"
                description={
                  debouncedSearch ? "Aucun résultat pour cette recherche." : "Ajoutez votre premier conducteur."
                }
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Nouveau conducteur
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
                      <TableHead>Conducteur</TableHead>
                      <TableHead className="hidden md:table-cell">Organisation</TableHead>
                      <TableHead className="hidden sm:table-cell">Véhicule</TableHead>
                      <TableHead className="hidden lg:table-cell">Permis</TableHead>
                      <TableHead className="hidden xl:table-cell">Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden xl:table-cell">Créé le</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((d) => {
                      const meta = driverStatusMeta[d.status] ?? { label: d.status, tone: "neutral" as const };
                      const permis = licenseState(d.licenseExpiresOn);
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/driver/${d.id}`}
                              prefetch={false}
                              className="flex flex-col hover:underline"
                            >
                              <span className="font-medium">{d.fullName}</span>
                              {d.employeeCode ? (
                                <span className="text-muted-foreground text-xs">{d.employeeCode}</span>
                              ) : null}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden max-w-48 md:table-cell">
                            {d.organizationId ? (
                              <OrganizationCell organization={d.organization} />
                            ) : (
                              <StatusBadge tone="neutral" dot={false}>
                                Vivier
                              </StatusBadge>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {d.vehicle ? (
                              <Link
                                href={`/dashboard/vehicles/${d.vehicle.id}`}
                                prefetch={false}
                                className="hover:underline"
                              >
                                {d.vehicle.registration}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex flex-col">
                              <span>{d.licenseCategories.length ? d.licenseCategories.join(" · ") : "—"}</span>
                              {permis ? (
                                <span
                                  className={
                                    permis === "expired" ? "text-destructive text-xs" : "text-amber-600 text-xs"
                                  }
                                >
                                  {permis === "expired" ? "Expiré" : "Expire"} le {formatDate(d.licenseExpiresOn)}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground xl:table-cell">{d.phone ?? "—"}</TableCell>
                          <TableCell>
                            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground xl:table-cell">
                            {formatDate(d.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <DriverRowActions driver={d} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar
                meta={drivers.data?.meta}
                perPage={perPage}
                label="conducteurs"
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

      <DriverFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultOrganizationId={organizationId ?? null}
        onCreated={(created) => router.push(`/dashboard/driver/${created.id}`)}
      />
    </div>
  );
}
