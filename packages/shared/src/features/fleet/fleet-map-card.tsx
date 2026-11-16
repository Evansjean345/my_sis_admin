"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "cn";
import type { Map as LeafletMap } from "leaflet";
import {
  Crosshair,
  ExternalLink,
  Layers,
  Maximize,
  Minimize,
  Minus,
  Navigation,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { vehicleTypeLabels } from "@/components/status-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatRelative } from "@/lib/format";
import {
  VEHICLE_TYPES,
  type VehicleDetail,
  type VehicleType,
} from "@/types/vehicle";

import { FleetMap } from "./fleet-map";
import {
  CATEGORY_OF,
  FLEET_CATEGORIES,
  FLEET_STATE_META,
  type FleetCategory,
  fleetState,
} from "./fleet-state";
import type { Basemap, FleetMapProps } from "./map";

export type TypeFilter = VehicleType | "all";

interface FleetMapCardProps extends Omit<
  FleetMapProps,
  "basemap" | "onMapReady" | "className"
> {
  /** Tous les véhicules (compteurs de légende, recherche) ; `vehicles` = véhicules filtrés affichés. */
  allVehicles: VehicleDetail[];
  title?: string;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  hiddenCategories: Set<FleetCategory>;
  onToggleCategory: (category: FleetCategory) => void;
  refreshing: boolean;
  onRefresh: () => void;
  /** Masque la recherche et les filtres (vue d'un seul véhicule). */
  compact?: boolean;
  className?: string;
}

function osmLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
}

function directionsLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`;
}

/** Bloc haut-gauche : recherche d'un véhicule + fiche de localisation (façon « place card »). */
function LocationCard({
  vehicles,
  selected,
  onSelect,
  compact,
}: {
  vehicles: VehicleDetail[];
  selected: VehicleDetail | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return vehicles
      .filter((v) =>
        `${v.registration} ${v.label ?? ""} ${v.brand ?? ""} ${v.model ?? ""}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 6);
  }, [query, vehicles]);

  const p = selected?.lastPosition;
  const lat = p ? Number(p.latitude) : null;
  const lng = p ? Number(p.longitude) : null;

  return (
    <div className="flex w-72 max-w-[calc(100vw-5rem)] flex-col gap-2">
      {!compact ? (
        <div className="relative z-20">
          <InputGroup className="bg-popover shadow-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un véhicule…"
              aria-label="Rechercher un véhicule"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  onSelect?.(results[0].id);
                  setQuery("");
                }
                if (e.key === "Escape") setQuery("");
              }}
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Effacer"
                  onClick={() => setQuery("")}
                >
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
          {query.trim() ? (
            <ul className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg">
              {results.length === 0 ? (
                <li className="px-3 py-2 text-muted-foreground text-sm">
                  Aucun véhicule
                </li>
              ) : (
                results.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      onClick={() => {
                        onSelect?.(v.id);
                        setQuery("");
                      }}
                    >
                      <span className="font-medium">{v.registration}</span>
                      <span className="text-muted-foreground text-xs">
                        {FLEET_STATE_META[fleetState(v)].label}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-3 rounded-lg border bg-popover/95 p-3 text-popover-foreground shadow-md backdrop-blur">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">
            {selected ? selected.registration : "Abidjan"}
          </span>
          <span className="truncate text-muted-foreground text-xs">
            {selected
              ? p
                ? `${lat?.toFixed(5)}, ${lng?.toFixed(5)} · ${formatRelative(p.recordedAt)}`
                : "Aucune position connue"
              : "Abidjan, Côte d'Ivoire"}
          </span>
        </div>
        {lat !== null && lng !== null ? (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon-sm" variant="ghost" asChild>
                  <a
                    href={osmLink(lat, lng)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ouvrir dans OpenStreetMap"
                  >
                    <ExternalLink />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ouvrir la carte</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="secondary"
                  asChild
                  className="rounded-full"
                >
                  <a
                    href={directionsLink(lat, lng)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Itinéraire"
                  >
                    <Navigation />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Itinéraire vers le véhicule</TooltipContent>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function FleetMapCard({
  allVehicles,
  title = "Suivi en temps réel",
  typeFilter,
  onTypeFilterChange,
  hiddenCategories,
  onToggleCategory,
  refreshing,
  onRefresh,
  compact = false,
  className,
  ...mapProps
}: FleetMapCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("plan");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setFullscreen(document.fullscreenElement === cardRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void cardRef.current?.requestFullscreen();
  }

  const counts = useMemo(() => {
    const c: Record<FleetCategory, number> = {
      moving: 0,
      alert: 0,
      parked: 0,
      offline: 0,
    };
    for (const v of allVehicles) c[CATEGORY_OF[fleetState(v)]]++;
    return c;
  }, [allVehicles]);

  const presentTypes = useMemo(
    () =>
      VEHICLE_TYPES.filter((t) => allVehicles.some((v) => v.vehicleType === t)),
    [allVehicles],
  );
  const selected =
    allVehicles.find((v) => v.id === mapProps.selectedId) ?? null;
  const active = allVehicles.length - counts.offline;

  function recenter() {
    if (!map) return;
    const pts = mapProps.vehicles
      .filter((v) => v.lastPosition)
      .map(
        (v) =>
          [
            Number(v.lastPosition?.latitude),
            Number(v.lastPosition?.longitude),
          ] as [number, number],
      );
    if (pts.length === 1) map.setView(pts[0], 15);
    else if (pts.length > 1)
      map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 });
  }

  return (
    <Card
      ref={cardRef}
      className={cn(
        "min-h-0 gap-3 pb-3",
        fullscreen && "h-dvh rounded-none",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          {title}
          <Badge
            variant="secondary"
            className="rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            {active} véhicule{active > 1 ? "s" : ""} actif
            {active > 1 ? "s" : ""}
          </Badge>
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Actualiser"
          >
            <RefreshCw className={refreshing ? "animate-spin" : undefined} />
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen}>
            {fullscreen ? (
              <Minimize data-icon="inline-start" />
            ) : (
              <Maximize data-icon="inline-start" />
            )}
            {fullscreen ? "Quitter" : "Plein écran"}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 px-3">
        <div className="relative size-full min-h-105 overflow-hidden rounded-lg border">
          <FleetMap {...mapProps} basemap={basemap} onMapReady={setMap} />

          {/* Haut gauche : recherche + fiche de localisation */}
          <div className="absolute top-3 left-3 z-10">
            <LocationCard
              vehicles={allVehicles}
              selected={selected}
              onSelect={mapProps.onSelect}
              compact={compact}
            />
          </div>

          {/* Haut droite : catégorie de véhicule */}
          {!compact ? (
            <div className="absolute top-3 right-3 z-10">
              <Select
                value={typeFilter}
                onValueChange={(v) => onTypeFilterChange(v as TypeFilter)}
              >
                <SelectTrigger
                  className="bg-popover shadow-md"
                  aria-label="Catégorie de véhicule"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectGroup>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {presentTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {vehicleTypeLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Bas gauche : fond de carte, zoom, recentrage */}
          <div className="absolute bottom-7 left-3 z-10 flex items-end gap-2">
            <button
              type="button"
              onClick={() =>
                setBasemap((b) => (b === "plan" ? "satellite" : "plan"))
              }
              className={cn(
                "flex size-14 flex-col items-center justify-end overflow-hidden rounded-lg border-2 border-popover pb-1 font-medium text-[10px] shadow-md",
                "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                basemap === "plan"
                  ? "bg-linear-to-br from-emerald-800 via-emerald-700 to-sky-900 text-white"
                  : "bg-linear-to-br from-slate-100 via-amber-50 to-sky-100 text-slate-800",
              )}
              aria-label={
                basemap === "plan"
                  ? "Afficher la vue satellite"
                  : "Afficher le plan"
              }
            >
              <Layers className="mb-auto mt-1.5 size-4" />
              {basemap === "plan" ? "Satellite" : "Plan"}
            </button>
            <div className="flex flex-col overflow-hidden rounded-lg border bg-popover shadow-md">
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-none"
                aria-label="Zoomer"
                onClick={() => map?.zoomIn()}
              >
                <Plus />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-none border-t"
                aria-label="Dézoomer"
                onClick={() => map?.zoomOut()}
              >
                <Minus />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                className="rounded-none border-t"
                aria-label="Recentrer sur la flotte"
                onClick={recenter}
              >
                <Crosshair />
              </Button>
            </div>
          </div>

          {/* Bas droite : légende filtrable */}
          {!compact ? (
            <div className="absolute right-3 bottom-7 z-10 min-w-48 rounded-lg border bg-popover/95 p-2 text-popover-foreground shadow-md backdrop-blur">
              <ul className="flex flex-col">
                {FLEET_CATEGORIES.map((c) => {
                  const hidden = hiddenCategories.has(c.value);
                  return (
                    <li key={c.value}>
                      <button
                        type="button"
                        aria-pressed={!hidden}
                        onClick={() => onToggleCategory(c.value)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2 py-1 text-left text-sm transition-opacity hover:bg-muted",
                          hidden && "opacity-40",
                        )}
                      >
                        <span className={cn("size-2.5 rounded-full", c.dot)} />
                        <span className="flex-1">{c.label}</span>
                        <span className="font-semibold tabular-nums">
                          {counts[c.value]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
