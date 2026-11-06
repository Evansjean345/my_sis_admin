import { ExternalLink, MapPin } from "lucide-react";

import { EmptyState } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { connectionStateMeta } from "@/components/status-labels";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import type { VehicleDetail } from "@/types/vehicle";

export function PositionCard({
  position,
  id,
}: {
  position: VehicleDetail["lastPosition"];
  id: VehicleDetail["id"];
}) {
  if (!position) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Dernière position</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<MapPin />}
            title="Aucune position"
            description="Le véhicule n'a encore transmis aucune trame."
          />
        </CardContent>
      </Card>
    );
  }

  // PostGIS / décimaux : on force la conversion numérique.
  const lat = Number(position.latitude);
  const lng = Number(position.longitude);
  const d = 0.01;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const link = `/dashboard/fleet?vehicle=${id}`;
  const state = connectionStateMeta(position.connectionState);

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Dernière position</CardTitle>
        <CardDescription>
          {formatDateTime(position.recordedAt)} ·{" "}
          {formatRelative(position.recordedAt)}
        </CardDescription>
        <CardAction>
          <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Vitesse</span>
          <span className="font-medium tabular-nums">
            {formatNumber(position.speedKph, 1)} km/h
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Contact</span>
          <span className="font-medium">
            {position.ignition === null
              ? "—"
              : position.ignition
                ? "Allumé"
                : "Coupé"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-xs">Coordonnées</span>
          <span className="font-mono text-xs">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      </CardContent>
      <div className="relative h-64 border-t">
        <iframe
          title="Position du véhicule"
          src={embed}
          className="size-full"
          loading="lazy"
        />
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2"
        >
          <a href={link} rel="noreferrer">
            <ExternalLink data-icon="inline-start" />
            Ouvrir la carte
          </a>
        </Button>
      </div>
    </Card>
  );
}
