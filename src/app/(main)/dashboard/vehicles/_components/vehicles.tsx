"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Download,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  OrganizationCell,
  OrganizationFilter,
} from "@/app/(main)/dashboard/_components/organization/organization-select";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import {
  vehicleStatusMeta,
  vehicleTypeLabels,
} from "@/components/status-labels";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVehicles } from "@/hooks/api/use-vehicles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, formatDate, formatNumber } from "@/lib/format";
import { VEHICLE_STATUSES, type VehicleStatus } from "@/types/vehicle";

import { VehicleFormDialog } from "./vehicle-form-dialog";
import { VehicleRowActions } from "./vehicle-row-actions";

const ALL = "all";

export function Vehicles() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VehicleStatus | typeof ALL>(ALL);
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const vehicles = useVehicles({
    page,
    perPage,
    search: debouncedSearch || undefined,
    status: status === ALL ? undefined : status,
    organizationId,
  });

  const rows = vehicles.data?.data ?? [];

  /*
  Export CSV : exporter les données au format CSV , format Excel
  */
  function exportCsv() {
    downloadCsv(
      `vehicules-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((v) => ({
        organisation: v.organization?.name ?? "",
        immatriculation: v.registration,
        libelle: v.label ?? "",
        marque: v.brand ?? "",
        modele: v.model ?? "",
        annee: v.year ?? "",
        type: vehicleTypeLabels[v.vehicleType] ?? v.vehicleType,
        statut: vehicleStatusMeta[v.status]?.label ?? v.status,
        limite_kmh: formatNumber(v.speedLimitKph),
        kilometrage: formatNumber(v.odometerKm),
        immobilisation: v.immobilizationEnabled ? "oui" : "non",
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Véhicules"
        description="Tous les véhicules de la plateforme : flotte, limites de vitesse et immobilisation à distance."
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportCsv}
              disabled={rows.length === 0}
            >
              <Download data-icon="inline-start" />
              Exporter
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nouveau véhicule
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <InputGroup className="md:max-w-lg">
          <InputGroupInput
            placeholder="Rechercher par immatriculation…"
            aria-label="Rechercher un véhicule"
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
            value={status}
            onValueChange={(v) => {
              setStatus(v as VehicleStatus | typeof ALL);
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
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {vehicleStatusMeta[s].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => vehicles.refetch()}
            disabled={vehicles.isFetching}
          >
            <RefreshCw
              data-icon="inline-start"
              className={vehicles.isFetching ? "animate-spin" : undefined}
            />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {vehicles.isPending ? (
            <LoadingRows rows={6} />
          ) : vehicles.isError ? (
            <div className="px-4">
              <ErrorState
                error={vehicles.error}
                onRetry={() => vehicles.refetch()}
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={<Truck />}
                title="Aucun véhicule"
                description={
                  debouncedSearch
                    ? "Aucun résultat pour cette recherche."
                    : "Ajoutez votre premier véhicule."
                }
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Nouveau véhicule
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
                      <TableHead>Immatriculation</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Organisation
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Marque / modèle
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Type
                      </TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Kilométrage
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Immobilisation
                      </TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden xl:table-cell">
                        Créé le
                      </TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((v) => {
                      const meta = vehicleStatusMeta[v.status] ?? {
                        label: v.status,
                        tone: "neutral" as const,
                      };
                      return (
                        <TableRow key={v.id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/vehicles/${v.id}`}
                              prefetch={false}
                              className="flex flex-col hover:underline"
                            >
                              <span className="font-medium">
                                {v.registration}
                              </span>
                              {v.label ? (
                                <span className="text-muted-foreground text-xs">
                                  {v.label}
                                </span>
                              ) : null}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden max-w-48 md:table-cell">
                            <OrganizationCell organization={v.organization} />
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-col">
                              <span>
                                {[v.brand, v.model].filter(Boolean).join(" ") ||
                                  "—"}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {v.year ?? ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground lg:table-cell">
                            {vehicleTypeLabels[v.vehicleType] ?? v.vehicleType}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatNumber(v.speedLimitKph)} km/h
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                            {formatNumber(v.odometerKm)} km
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {v.immobilizationEnabled ? (
                              <StatusBadge tone="success" dot={false}>
                                <ShieldCheck className="size-3" />
                                Autorisée
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="neutral" dot={false}>
                                Désactivée
                              </StatusBadge>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge tone={meta.tone}>
                              {meta.label}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground xl:table-cell">
                            {formatDate(v.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <VehicleRowActions vehicle={v} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar
                meta={vehicles.data?.meta}
                perPage={perPage}
                label="véhicules"
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

      <VehicleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultOrganizationId={organizationId}
      />
    </div>
  );
}
