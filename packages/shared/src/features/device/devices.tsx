"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { Cpu, Download, FolderPlus, Grid2X2, List } from "lucide-react";

import { PaginationBar } from "@shared/components/pagination-bar";
import { Can } from "@shared/components/providers/access-provider";
import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { deviceStatusMeta } from "@shared/components/status-labels";
import { Button } from "@shared/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@shared/components/ui/toggle-group";
import { DeviceCreateDialog } from "@shared/features/device/device-create-dialog";
import { DeviceGridView } from "@shared/features/device/device-grid-view";
import { DeviceListView } from "@shared/features/device/device-list-view";
import { type DeviceSort, DeviceToolbar } from "@shared/features/device/device-toolbar";
import { InUseSection } from "@shared/features/device/in-use-section";
import { useDevices } from "@shared/hooks/api/use-devices";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { downloadCsv, formatDateTime } from "@shared/lib/format";
import type { Device, DeviceStatus } from "@shared/types/device";

export type DeviceView = "grid" | "list";

const STATUS_ORDER: Record<DeviceStatus, number> = { active: 0, maintenance: 1, stock: 2, decommissioned: 3 };

function sortDevices(devices: Device[], sort: DeviceSort): Device[] {
  const copy = [...devices];
  if (sort === "created") return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (sort === "status") return copy.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  return copy.sort((a, b) => a.imei.localeCompare(b.imei));
}

export function Devices({ view }: { view: DeviceView }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeviceStatus | "all">("all");
  const [unassigned, setUnassigned] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [sort, setSort] = useState<DeviceSort>("imei");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const [createOpen, setCreateOpen] = useState(false);

  const debounced = useDebouncedValue(search.trim());
  // L'API exige 3 caractères minimum pour `search`.
  const effectiveSearch = debounced.length >= 3 ? debounced : undefined;

  const devices = useDevices({
    page,
    perPage,
    search: effectiveSearch,
    status: status === "all" ? undefined : status,
    unassigned: unassigned || undefined,
    organizationId,
  });
  // Section « en cours d'utilisation » : trackers actifs de l'organisation filtrée.
  const active = useDevices({ status: "active", perPage: 8, organizationId });

  const rows = useMemo(() => sortDevices(devices.data?.data ?? [], sort), [devices.data, sort]);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function exportCsv() {
    downloadCsv(
      `trackers-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((d) => ({
        organisation: d.organization?.name ?? "",
        imei: d.imei,
        fabricant: d.manufacturer,
        modele: d.model,
        relais: d.hasRelay ? "oui" : "non",
        sim: d.simMsisdn ?? "",
        statut: deviceStatusMeta[d.status]?.label ?? d.status,
        flespi_device_id: d.flespiDeviceId ?? "",
        flespi_ident: d.flespiIdent ?? "",
        canal: d.flespiChannelId ?? "",
        enregistre_le: formatDateTime(d.createdAt),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Liste des trackers</h1>
          <p className="text-muted-foreground text-sm">
            Tous les trackers de la plateforme : enregistrement, rattachement flespi et montage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Can levels={[1]}>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <FolderPlus data-icon="inline-start" />
              Nouveau tracker
            </Button>
          </Can>
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            <Download data-icon="inline-start" />
            Exporter la liste
          </Button>
        </div>
      </div>

      <DeviceToolbar
        search={search}
        onSearchChange={resetPage(setSearch)}
        status={status}
        onStatusChange={resetPage(setStatus)}
        unassigned={unassigned}
        onUnassignedChange={resetPage(setUnassigned)}
        sort={sort}
        onSortChange={setSort}
        organizationId={organizationId}
        onOrganizationChange={resetPage(setOrganizationId)}
        refreshing={devices.isFetching}
        onRefresh={() => {
          devices.refetch();
          active.refetch();
        }}
      />

      <InUseSection devices={active.data?.data ?? []} loading={active.isPending} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium text-lg">
            Tous les trackers
            {devices.data ? (
              <span className="ml-2 font-normal text-muted-foreground text-sm">({devices.data.meta.total})</span>
            ) : null}
          </h2>
          <ToggleGroup type="single" variant="outline" size="sm" spacing={0} value={view} aria-label="Affichage">
            <ToggleGroupItem value="grid" asChild>
              <Link href="?view=grid" prefetch={false} replace scroll={false}>
                <Grid2X2 />
                Grille
              </Link>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" asChild>
              <Link href="?view=list" prefetch={false} replace scroll={false}>
                <List />
                Liste
              </Link>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {devices.isPending ? (
          <LoadingRows rows={6} className="flex flex-col gap-2" />
        ) : devices.isError ? (
          <ErrorState error={devices.error} onRetry={() => devices.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Cpu />}
            title="Aucun tracker"
            description={
              effectiveSearch || status !== "all" || unassigned
                ? "Aucun résultat pour ces filtres."
                : "Enregistrez votre premier tracker."
            }
            action={
              <Can levels={[1]}>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <FolderPlus data-icon="inline-start" />
                  Nouveau tracker
                </Button>
              </Can>
            }
          />
        ) : (
          <>
            {view === "list" ? <DeviceListView devices={rows} /> : <DeviceGridView devices={rows} />}
            <PaginationBar
              meta={devices.data?.meta}
              perPage={perPage}
              label="trackers"
              onPageChange={setPage}
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <DeviceCreateDialog open={createOpen} onOpenChange={setCreateOpen} defaultOrganizationId={organizationId} />
    </div>
  );
}
