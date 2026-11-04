"use client";
import { useMemo, useState } from "react";

import { type ColumnFiltersState, type PaginationState, useTable } from "@tanstack/react-table";
import { Info, RefreshCw, Search } from "lucide-react";

import { ErrorState, LoadingRows } from "@/components/query-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoles } from "@/hooks/api/use-roles";
import { useUsers } from "@/hooks/api/use-users";
import { dataTableFeatures } from "@/lib/data-table-features";

import { PermissionMatrix } from "./permission-matrix";
import { RoleSheet } from "./role-sheet";
import { getRolesColumns } from "./roles-table/columns";
import { CUSTOM_GROUP, type RoleRow, SYSTEM_GROUP } from "./roles-table/data";
import { RolesTable } from "./roles-table/table";

const ROLE_ORDER = ["super_admin", "admin", "operator"];

export function Roles() {
  const roles = useRoles();
  // Comptage des utilisateurs par rôle (100 max côté API) — facultatif si l'accès est refusé.
  const users = useUsers({ page: 1, perPage: 100 });
  const [selected, setSelected] = useState<RoleRow | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 12 });

  const rows = useMemo<RoleRow[]>(() => {
    const counts = new Map<string, number>();
    for (const u of users.data?.data ?? []) counts.set(u.roleId, (counts.get(u.roleId) ?? 0) + 1);
    return [...(roles.data ?? [])]
      .sort((a, b) => {
        const ia = ROLE_ORDER.indexOf(a.code);
        const ib = ROLE_ORDER.indexOf(b.code);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
      })
      .map((role) => ({
        ...role,
        group: role.is_system ? SYSTEM_GROUP : CUSTOM_GROUP,
        usersCount: users.data ? (counts.get(role.id) ?? 0) : null,
      }));
  }, [roles.data, users.data]);

  const columns = useMemo(() => getRolesColumns(setSelected), []);

  const table = useTable({
    features: dataTableFeatures,
    data: rows,
    columns,
    defaultColumn: { size: 140, minSize: 80, maxSize: 420 },
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    initialState: { columnVisibility: { group: false, search: false } },
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const groupFilter = (table.getColumn("group")?.getFilterValue() as string | undefined) ?? "All";

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Rôles et permissions</h1>
          <p className="text-muted-foreground text-sm">Niveaux d'accès disponibles dans votre organisation.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => roles.refetch()} disabled={roles.isFetching}>
          <RefreshCw data-icon="inline-start" className={roles.isFetching ? "animate-spin" : undefined} />
          Actualiser
        </Button>
      </div>

      <Tabs className="h-full gap-4" defaultValue="roles">
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none"
        >
          <TabsTrigger value="roles">Rôles</TabsTrigger>
          <TabsTrigger value="matrix">Matrice des permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="flex flex-col gap-4">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Rôles système</AlertTitle>
              <AlertDescription>
                Les rôles sont définis par la plateforme. Attribuez-les depuis l'écran Utilisateurs.
              </AlertDescription>
            </Alert>

            {roles.isError ? (
              <ErrorState error={roles.error} onRetry={() => roles.refetch()} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                <div className="flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <InputGroup className="h-7 w-full rounded-md sm:w-82">
                    <InputGroupAddon>
                      <Search />
                    </InputGroupAddon>
                    <InputGroupInput
                      className="h-7"
                      placeholder="Rechercher un rôle ou une permission…"
                      aria-label="Rechercher un rôle"
                      value={search}
                      onChange={(e) => {
                        table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                        table.setPageIndex(0);
                      }}
                    />
                  </InputGroup>

                  <Select
                    value={groupFilter}
                    onValueChange={(v) => {
                      table.getColumn("group")?.setFilterValue(v === "All" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">Type :</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="All">Tous</SelectItem>
                        <SelectItem value={SYSTEM_GROUP}>Système</SelectItem>
                        <SelectItem value={CUSTOM_GROUP}>Personnalisé</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {roles.isPending ? <LoadingRows rows={5} /> : <RolesTable table={table} />}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          {roles.isPending ? (
            <LoadingRows rows={5} />
          ) : roles.isError ? (
            <ErrorState error={roles.error} onRetry={() => roles.refetch()} />
          ) : (
            <PermissionMatrix roles={rows} />
          )}
        </TabsContent>
      </Tabs>

      <RoleSheet role={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
