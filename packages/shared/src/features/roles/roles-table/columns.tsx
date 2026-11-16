"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical } from "lucide-react";

import { permissionLabel } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import type { RoleRow } from "@shared/features/roles/roles-table/data";
import type { DataTableFeatures } from "@shared/lib/data-table-features";

export function getRolesColumns(onView: (role: RoleRow) => void): ColumnDef<DataTableFeatures, RoleRow>[] {
  return [
    {
      id: "group",
      accessorKey: "group",
      filterFn: "equalsString",
      enableHiding: true,
    },
    {
      id: "search",
      accessorFn: (row) => [row.name, row.code, row.description ?? "", ...row.permissions].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "role",
      accessorKey: "name",
      header: "Rôle",
      size: 200,
      minSize: 180,
      cell: ({ row }) => (
        <button type="button" className="flex flex-col text-left" onClick={() => onView(row.original)}>
          <span className="font-medium text-sm hover:underline">{row.original.name}</span>
          <span className="font-mono text-muted-foreground text-xs">{row.original.code}</span>
        </button>
      ),
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      size: 260,
      cell: ({ row }) => (
        <span className="line-clamp-2 whitespace-normal text-muted-foreground text-sm">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "users",
      accessorKey: "usersCount",
      header: "Utilisateurs",
      size: 100,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.usersCount ?? "—"}</span>,
    },
    {
      id: "permissions",
      accessorFn: (row) => row.permissions.join(" "),
      header: "Permissions",
      size: 340,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-start gap-2">
          {row.original.permissions.slice(0, 3).map((permission) => (
            <Badge className="rounded-sm" variant="outline" key={permission} title={permission}>
              {permissionLabel(permission)}
            </Badge>
          ))}
          {row.original.permissions.length > 3 ? (
            <span className="text-sm tabular-nums">+{row.original.permissions.length - 3}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "type",
      accessorFn: (row) => (row.is_system ? "Système" : "Personnalisé"),
      header: "Type",
      size: 120,
      cell: ({ row }) => (
        <Badge className="rounded-sm" variant="outline">
          {row.original.is_system ? "Système" : "Personnalisé"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 70,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${row.original.name}`}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onView(row.original)}>
                <Eye />
                Voir les permissions
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableColumnFilter: false,
    },
  ];
}
