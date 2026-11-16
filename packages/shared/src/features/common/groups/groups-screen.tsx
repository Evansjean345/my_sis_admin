"use client";

import { useState } from "react";

import Link from "next/link";

import { Download, Plus, RefreshCw, Search } from "lucide-react";

import { MetricCard, metricGridClass } from "@shared/components/metric-card";
import { PageHeader } from "@shared/components/page-header";
import { PaginationBar } from "@shared/components/pagination-bar";
import { Can } from "@shared/components/providers/access-provider";
import { EmptyState, ErrorState, LoadingRows } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@shared/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { GroupColorDot } from "@shared/features/common/groups/group-color-field";
import type { GroupFamily } from "@shared/features/common/groups/group-family";
import { GroupFormDialog } from "@shared/features/common/groups/group-form-dialog";
import { GroupRowActions } from "@shared/features/common/groups/group-row-actions";
import { OrganizationCell, OrganizationFilter } from "@shared/features/common/organization/organization-select";
import { useGroups } from "@shared/hooks/api/use-groups";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { downloadCsv, formatDate } from "@shared/lib/format";

/**
 * Liste des groupes d'une famille.
 *
 * Écran unique pour les flottes et les lots de boîtiers : seul le
 * vocabulaire change (`family`), le reste est rigoureusement identique côté
 * API comme côté usage.
 */
export function GroupsScreen({ family }: { family: GroupFamily }) {
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim());

  const groups = useGroups(family.kind, {
    page,
    perPage,
    search: debouncedSearch || undefined,
    organizationId,
  });

  const rows = groups.data?.data ?? [];
  const total = groups.data?.meta.total ?? 0;
  const assigned = rows.reduce((sum, group) => sum + group.membersCount, 0);
  const empties = rows.filter((group) => group.membersCount === 0).length;

  function exportCsv() {
    downloadCsv(
      `${family.kind}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((group) => ({
        nom: group.name,
        description: group.description ?? "",
        couleur: group.color ?? "",
        effectif: group.membersCount,
        cree_le: formatDate(group.createdAt),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={family.title}
        description={family.description}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
              <Download data-icon="inline-start" />
              Exporter
            </Button>
            <Can permission={family.writePermission}>
              {" "}
              <Button onClick={() => setCreateOpen(true)}>
                <Plus data-icon="inline-start" />
                Nouveau groupe
              </Button>
            </Can>
          </>
        }
      />

      <div className={metricGridClass}>
        <MetricCard icon={family.icon} label="Groupes" value={total} hint={`${family.title} de votre organisation.`} />
        <MetricCard
          icon={family.memberIcon}
          label={`${family.memberPlural.charAt(0).toUpperCase()}${family.memberPlural.slice(1)} affectés`}
          value={assigned}
          hint="Sur la page affichée."
        />
        <MetricCard
          icon={family.icon}
          label="Groupes vides"
          value={empties}
          hint="Un groupe vide ne remonte rien dans l'audit."
        />
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <InputGroup className="md:max-w-lg">
          <InputGroupInput
            placeholder="Rechercher par nom…"
            aria-label="Rechercher un groupe"
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
          <OrganizationFilter
            value={organizationId}
            onChange={(id) => {
              setOrganizationId(id);
              setPage(1);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => groups.refetch()} disabled={groups.isFetching}>
            <RefreshCw data-icon="inline-start" className={groups.isFetching ? "animate-spin" : undefined} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {groups.isPending ? (
            <LoadingRows rows={6} />
          ) : groups.isError ? (
            <div className="px-4">
              <ErrorState error={groups.error} onRetry={() => groups.refetch()} />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4">
              <EmptyState
                icon={<family.icon />}
                title="Aucun groupe"
                description={
                  debouncedSearch
                    ? "Aucun résultat pour cette recherche."
                    : `Créez ${family.singularWithArticle} pour organiser vos ${family.memberPlural}.`
                }
                action={
                  <Can permission={family.writePermission}>
                    <Button size="sm" onClick={() => setCreateOpen(true)}>
                      <Plus data-icon="inline-start" />
                      Nouveau groupe
                    </Button>
                  </Can>
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead className="hidden md:table-cell">Organisation</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                      <TableHead className="w-28">Effectif</TableHead>
                      <TableHead className="hidden xl:table-cell">Créé le</TableHead>
                      <TableHead className="w-12">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <Link
                            href={`${family.route}/${group.id}`}
                            prefetch={false}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <GroupColorDot color={group.color} />
                            <span className="font-medium">{group.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden max-w-48 md:table-cell">
                          <OrganizationCell organization={group.organization} />
                        </TableCell>
                        <TableCell className="hidden max-w-sm truncate text-muted-foreground lg:table-cell">
                          {group.description ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {group.membersCount} {group.membersCount > 1 ? family.memberPlural : family.memberSingular}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">
                          {formatDate(group.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <GroupRowActions family={family} group={group} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <PaginationBar
                meta={groups.data?.meta}
                perPage={perPage}
                label="groupes"
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

      <GroupFormDialog
        family={family}
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultOrganizationId={organizationId}
      />
    </div>
  );
}
