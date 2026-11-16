"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { MapPinned, Search } from "lucide-react";

import { useAccess } from "@shared/components/providers/access-provider";
import { EmptyState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { SecurityActions } from "@shared/features/common/commands/security-actions";
import { FLEET_STATE_META, fleetState } from "@shared/features/fleet/fleet-state";
import { formatDateTime, formatNumber, formatRelative, toNumber } from "@shared/lib/format";
import type { VehicleDetail } from "@shared/types/vehicle";

/** Ordre d'affichage : ce qui demande une attention d'abord. */
const STATE_RANK = { alert: 0, moving: 1, idle: 2, stopped: 3, offline: 4, unknown: 5 } as const;

/**
 * Mes véhicules — consultation et sécurité.
 *
 * Aucune action de gestion (création, modification, montage) : seulement le
 * suivi et la coupure / le rétablissement du carburant, que l'opérateur
 * détient (`command:immobilize`) et que l'API contrôle (vitesse, fraîcheur
 * de position, traçabilité).
 */
export function OperatorVehicles({ vehicles, loading }: { vehicles: VehicleDetail[]; loading: boolean }) {
  const { can } = useAccess();
  const [search, setSearch] = useState("");
  const canImmobilize = can("command:immobilize");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles
      .filter((v) => !q || v.registration.toLowerCase().includes(q) || (v.label ?? "").toLowerCase().includes(q))
      .map((v) => ({ v, state: fleetState(v) }))
      .sort((a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.v.registration.localeCompare(b.v.registration));
  }, [vehicles, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes véhicules</CardTitle>
        <CardDescription>Ordonnés par priorité : survitesse, déplacement, arrêt, hors ligne</CardDescription>
        <CardAction>
          <InputGroup className="w-56">
            <InputGroupInput
              placeholder="Immatriculation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un véhicule"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <LoadingRows rows={6} />
        ) : rows.length === 0 ? (
          <div className="px-6">
            <EmptyState
              title={search ? "Aucun résultat" : "Aucun véhicule"}
              description={
                search
                  ? "Aucun véhicule ne correspond à cette recherche."
                  : "Votre administrateur n'a pas encore rattaché de véhicule à votre organisation."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Véhicule</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Vitesse</TableHead>
                <TableHead className="hidden md:table-cell">Dernière position</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ v, state }) => {
                const meta = FLEET_STATE_META[state];
                const speed = toNumber(v.lastPosition?.speedKph);
                const limit = toNumber(v.speedLimitKph);
                return (
                  <TableRow key={v.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/dashboard/vehicles/${v.id}`}
                        prefetch={false}
                        className="flex flex-col font-medium hover:underline"
                      >
                        {v.registration}
                        <span className="font-normal text-muted-foreground text-xs">
                          {[v.brand, v.model].filter(Boolean).join(" ") || v.label || "—"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {speed === null ? "—" : `${formatNumber(Math.round(speed))} km/h`}
                      {limit ? (
                        <span className="block text-muted-foreground text-xs">limite {formatNumber(limit)}</span>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className="hidden text-muted-foreground md:table-cell"
                      title={formatDateTime(v.lastPosition?.recordedAt)}
                    >
                      {v.lastPosition ? formatRelative(v.lastPosition.recordedAt) : "Aucune position"}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/fleet/${v.id}`} prefetch={false}>
                            <MapPinned data-icon="inline-start" />
                            Suivre
                          </Link>
                        </Button>
                        {canImmobilize ? (
                          <SecurityActions
                            vehicleId={v.id}
                            deviceId={v.device?.id}
                            hasRelay={v.device?.hasRelay ?? false}
                            immobilizationEnabled={v.immobilizationEnabled}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
