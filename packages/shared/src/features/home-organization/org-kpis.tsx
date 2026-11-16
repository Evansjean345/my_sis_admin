"use client";

import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import { CarFront, CarTaxiFront, Cpu, Radio, Send, Users } from "lucide-react";

import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatNumber } from "@shared/lib/format";
import type { OrganizationOverview } from "@shared/types/admin";

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  href,
  alert,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint: React.ReactNode;
  href?: string;
  alert?: string | null;
}) {
  const body = (
    <Card className="h-full gap-3 transition-colors hover:bg-muted/40">
      <CardHeader className="gap-1">
        <CardDescription className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            {label}
          </span>
          {alert ? (
            <Badge variant="destructive" className="rounded-full">
              {alert}
            </Badge>
          ) : null}
        </CardDescription>
        <CardTitle className="font-semibold text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{hint}</CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} prefetch={false} className="block rounded-xl focus-visible:outline-2">
      {body}
    </Link>
  ) : (
    body
  );
}

/**
 * Indicateurs de l'organisation (GET /overview) + compteur temps réel.
 * Chaque tuile ouvre l'écran de gestion correspondant.
 */
export function OrgKpis({
  overview,
  loading,
  movingNow,
  liveReceived,
}: {
  overview: OrganizationOverview | undefined;
  loading: boolean;
  /** Véhicules en déplacement d'après la dernière position connue (temps réel compris). */
  movingNow: number;
  /** Trames reçues par le flux depuis l'ouverture de la page. */
  liveReceived: number;
}) {
  if (loading || !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: squelettes statiques
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  const { vehicles, devices, users, groups, commands } = overview;
  const unequipped = Math.max(vehicles.total - vehicles.withDevice, 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <Tile
        icon={Radio}
        label="En direct"
        value={formatNumber(movingNow)}
        hint={<>véhicules en déplacement · {formatNumber(liveReceived)} trames reçues</>}
        href="/dashboard/fleet"
      />
      <Tile
        icon={CarFront}
        label="Véhicules"
        value={formatNumber(vehicles.total)}
        hint={
          <>
            {formatNumber(vehicles.active)} actifs · {formatNumber(vehicles.withDevice)} équipés
          </>
        }
        alert={unequipped > 0 ? `${unequipped} sans tracker` : null}
        href="/dashboard/vehicles"
      />
      <Tile
        icon={CarTaxiFront}
        label="Flottes"
        value={formatNumber(groups.vehicles)}
        hint={<>{formatNumber(groups.devices)} lots de trackers</>}
        href="/dashboard/group_vehicle"
      />
      <Tile
        icon={Cpu}
        label="Trackers"
        value={formatNumber(devices.total)}
        hint={<>{formatNumber(devices.assigned)} montés sur un véhicule</>}
        alert={devices.silentSince24h > 0 ? `${devices.silentSince24h} muets 24 h` : null}
        href="/dashboard/device"
      />
      <Tile
        icon={Users}
        label="Utilisateurs"
        value={formatNumber(users.total)}
        hint={<>{formatNumber(users.active)} comptes actifs</>}
        href="/dashboard/users"
      />
      <Tile
        icon={Send}
        label="Commandes · 24 h"
        value={formatNumber(commands.last24h)}
        hint={<>{formatNumber(commands.inFlight)} en cours</>}
        alert={commands.failedLast24h > 0 ? `${commands.failedLast24h} échecs` : null}
        href="/dashboard/audit"
      />
    </div>
  );
}
