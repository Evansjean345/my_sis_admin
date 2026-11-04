"use client";

import { useState } from "react";

import Link from "next/link";

import { Building2, Download, Plus, PowerOff, RefreshCw, Search } from "lucide-react";

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
import { useOrganizations } from "@/hooks/api/use-organizations";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv, formatDate } from "@/lib/format";

import { OrganizationFormDialog } from "./organization-form-dialog";
import { OrganizationRowActions } from "./organization-row-actions";

const ALL = "all";

/**
 * Entreprises clientes.
 *
 * Écran réservé à l'exploitant plateforme : un administrateur client reçoit
 * 403 sur `/organizations`. L'état d'erreur le dit explicitement plutôt que
 * d'afficher une liste vide trompeuse.
 */
export function Organizations() {
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const organizations = useOrganizations({
    page,
    perPage,
    search: debouncedSearch || undefined,
    isActive: activity === ALL ? undefined : activity === "active",
  });

  const rows = organizations.data?.data ?? [];
  const total = organizations.data?.meta.total ?? 0;
  const inactive = rows.filter((organization) => !organization.isActive).length;

  function exportCsv() {
    downloadCsv(
      `entreprises-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((organization) => ({
        code: organization.code,
        nom: organization.name,
        email: organization.contactEmail ?? "",
        telephone: organization.contactPhone ?? "",
        pays: organization.countryCode ?? "",
        fuseau: organization.timezone,
        statut: organization.isActive ? "active" : "inactive",
        creee_le: formatDate(organization.createdAt),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Entreprises"
        description="Organisations clientes de la plateforme : création, coordonnées et comptes rattachés."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
              <Download data-icon="inline-start" />
              Exporter
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Nouvelle entreprise
            </Button>
          </>
        }
      />

      <div className={metricGridClass}>
        <MetricCard icon={Building2} label="Entreprises" value={total} hint="Organisations enregistrées." />
        <MetricCard
          icon={PowerOff}
          label="Désactivées"
          value={inactive}
          hint="Sur la page affichée : leurs comptes ne peuvent plus se connecter."
        />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <InputGroup className="md:max-w-lg">
          <InputGroupInput
            placeholder="Rechercher par nom ou par code…"
            aria-label="Rechercher une entreprise"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
          <Select
            value={activity}
            onValueChange={(value) => {
              setActivity(value);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">État :</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                <SelectItem value={ALL}>Toutes</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="inactive">Désactivées</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => organizations.refetch()}
            disabled={organizations.isFetching}
          >
            <RefreshCw data-icon="inline-start" className={organizations.isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {organizations.isPending ? (
            <LoadingRows rows={6} />
          ) : organizations.isError ? (
            <div className="px-4">
              <ErrorState
                error={organizations.error}
                onRetry={() => organizations.refetch()}
                title="Entreprises indisponibles"
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={<Building2 />}
                title="Aucune entreprise"
                description={
                  debouncedSearch
                    ? "Aucun résultat pour cette recherche."
                    : "Créez votre première organisation cliente."
                }
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Nouvelle entreprise
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
                      <TableHead>Entreprise</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead className="hidden lg:table-cell">Pays / fuseau</TableHead>
                      <TableHead>État</TableHead>
                      <TableHead className="hidden xl:table-cell">Créée le</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((organization) => (
                      <TableRow key={organization.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/entreprises/${organization.id}`}
                            prefetch={false}
                            className="flex flex-col hover:underline"
                          >
                            <span className="font-medium">{organization.name}</span>
                            <span className="font-mono text-muted-foreground text-xs">{organization.code}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span>{organization.contactEmail ?? "—"}</span>
                            <span className="text-muted-foreground text-xs">{organization.contactPhone ?? ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {[organization.countryCode, organization.timezone].filter(Boolean).join(" · ")}
                        </TableCell>
                        <TableCell>
                          {organization.isActive ? (
                            <StatusBadge tone="success">Active</StatusBadge>
                          ) : (
                            <StatusBadge tone="orange">Désactivée</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {formatDate(organization.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <OrganizationRowActions organization={organization} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar
                meta={organizations.data?.meta}
                perPage={perPage}
                label="entreprises"
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

      <OrganizationFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
