import Link from "next/link";

import { Button } from "@shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { OrganizationCell } from "@shared/features/common/organization/organization-select";
import { DeviceActions } from "@shared/features/device/device-actions";
import { DeviceStatusBadge, FlespiBadge } from "@shared/features/device/device-badges";
import { deviceHref } from "@shared/features/device/device-links";
import { formatDateTime } from "@shared/lib/format";
import type { Device } from "@shared/types/device";

export function DeviceListView({ devices }: { devices: Device[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-0">Identifiant (IMEI)</TableHead>
            <TableHead className="hidden md:table-cell">Organisation</TableHead>
            <TableHead className="hidden md:table-cell">Fournisseur</TableHead>
            <TableHead className="hidden sm:table-cell">Modèle</TableHead>
            <TableHead className="hidden lg:table-cell">SIM</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="hidden xl:table-cell">Ident flespi</TableHead>
            <TableHead className="hidden lg:table-cell">Enregistré le</TableHead>
            <TableHead className="w-20">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="pl-0">
                <div className="flex min-w-0 items-center gap-3">
                  <Button variant="link" size="sm" asChild className="h-auto max-w-72 justify-start px-0 font-mono">
                    <Link href={deviceHref(device.id)} prefetch={false}>
                      <span className="truncate">{device.imei}</span>
                    </Link>
                  </Button>
                  <span className="hidden xl:inline-flex">
                    <FlespiBadge device={device} />
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden max-w-48 md:table-cell">
                <OrganizationCell organization={device.organization} />
              </TableCell>
              <TableCell className="hidden capitalize md:table-cell">{device.manufacturer}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {device.model}
                {device.hasRelay ? " · relais" : ""}
              </TableCell>
              <TableCell className="hidden text-muted-foreground tabular-nums lg:table-cell">
                {device.simMsisdn ?? "—"}
              </TableCell>
              <TableCell>
                <DeviceStatusBadge status={device.status} />
              </TableCell>
              <TableCell className="hidden font-mono text-muted-foreground text-xs xl:table-cell">
                {device.flespiIdent ?? "—"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatDateTime(device.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <DeviceActions device={device} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
