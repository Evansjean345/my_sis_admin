"use client";

import Link from "next/link";

import { Filter, FilterX } from "lucide-react";

import { ErrorState, LoadingRows } from "@shared/components/query-state";
import { StatusBadge } from "@shared/components/status-badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { useOrganizationsStats } from "@shared/hooks/api/use-admin";
import { formatNumber } from "@shared/lib/format";

/**
 * Comparatif des clients (GET /admin/organizations/stats), trié par taille de
 * flotte. « Filtrer » applique l'organisation à tout le tableau de bord.
 */
export function OrganizationsTable({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}) {
  const stats = useOrganizationsStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisations</CardTitle>
        <CardDescription>Comptes, véhicules et boîtiers par client</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {stats.isPending ? (
          <LoadingRows rows={5} />
        ) : stats.isError ? (
          <div className="px-6">
            <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
          </div>
        ) : stats.data.length === 0 ? (
          <p className="px-6 py-10 text-center text-muted-foreground text-sm">Aucune organisation.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Organisation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Utilisateurs</TableHead>
                <TableHead className="text-right">Véhicules</TableHead>
                <TableHead className="text-right">Boîtiers</TableHead>
                <TableHead className="pr-6 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...stats.data]
                .sort((a, b) => b.vehicles - a.vehicles || a.name.localeCompare(b.name))
                .map((org) => {
                  const selected = org.id === selectedId;
                  return (
                    <TableRow key={org.id} data-state={selected ? "selected" : undefined}>
                      <TableCell className="pl-6">
                        <Button variant="link" className="h-auto p-0 font-medium" asChild>
                          <Link prefetch={false} href={`/dashboard/entreprises/${org.id}`}>
                            {org.name}
                          </Link>
                        </Button>
                        <p className="text-muted-foreground text-xs">{org.code}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={org.isActive ? "success" : "neutral"}>
                          {org.isActive ? "Active" : "Désactivée"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(org.users)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(org.vehicles)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(org.devices)}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button
                          size="sm"
                          variant={selected ? "secondary" : "ghost"}
                          onClick={() => onSelect(selected ? undefined : org.id)}
                          aria-pressed={selected}
                        >
                          {selected ? <FilterX data-icon="inline-start" /> : <Filter data-icon="inline-start" />}
                          {selected ? "Retirer" : "Filtrer"}
                        </Button>
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
