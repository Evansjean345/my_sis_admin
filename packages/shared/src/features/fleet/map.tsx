"use client";

import { useEffect, useMemo, useRef } from "react";

import type { LatLngBoundsExpression, LatLngExpression, Map as LeafletMap } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { FLEET_STATE_META, fleetState, hasPosition } from "@shared/features/fleet/fleet-state";
import { endIcon, replayIcon, startIcon, stopIcon, vehicleIcon } from "@shared/features/fleet/vehicle-marker";
import { formatDateTime, formatNumber, formatRelative, toNumber } from "@shared/lib/format";
import { formatDuration } from "@shared/lib/track";
import type { SpeedBand, TrackPoint, TrackSegment, TrackStop } from "@shared/types/track";
import type { VehicleDetail } from "@shared/types/vehicle";

/** Abidjan — centre par défaut quand aucune position n'est connue. */
const DEFAULT_CENTER: LatLngExpression = [5.3364, -4.0267];

/** Couleur des tronçons : classes appliquées au <path> SVG (le CSS prime sur l'attribut stroke). */
const BAND_CLASS: Record<SpeedBand, string> = {
  normal: "stroke-primary",
  stopped: "stroke-sky-400",
  overspeed: "stroke-red-500",
};

export type Basemap = "plan" | "satellite";

const BASEMAPS: Record<Basemap, { url: string; attribution: string; maxZoom: number; className?: string }> = {
  plan: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    // Mode sombre : on inverse les tuiles claires pour rester dans la charte du dashboard.
    className: "dark:brightness-90 dark:contrast-90 dark:hue-rotate-180 dark:invert",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagerie &copy; Esri",
    maxZoom: 19,
  },
};

export interface FleetMapTrack {
  points: TrackPoint[];
  segments: TrackSegment[];
  stops: TrackStop[];
}

export interface FleetMapProps {
  vehicles: VehicleDetail[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  track?: FleetMapTrack | null;
  /** Point courant du rejeu (index dans track.points). */
  replayIndex?: number | null;
  /** Cap connu du véhicule sélectionné (dernier point de trajet). */
  selectedHeading?: number | null;
  basemap?: Basemap;
  /** Instance Leaflet, pour piloter la carte depuis des contrôles extérieurs (zoom, recentrage). */
  onMapReady?: (map: LeafletMap) => void;
  /** Marge réservée à droite (px) pour un panneau posé sur la carte. */
  rightInset?: number;
  className?: string;
}

function FitView({
  vehicles,
  selectedId,
  track,
  rightInset = 0,
}: Pick<FleetMapProps, "vehicles" | "selectedId" | "track" | "rightInset">) {
  const map = useMap();
  const lastKey = useRef<string>("");

  useEffect(() => {
    const selected = vehicles.find((v) => v.id === selectedId);
    const trackPts = track?.points ?? [];
    // On ne recadre que lorsque le sujet change (sélection ou nouveau trajet), pas à chaque rafraîchissement.
    const key = `${selectedId ?? "all"}|${trackPts.length ? `${trackPts[0].ts}-${trackPts.length}` : "none"}|${
      vehicles.length
    }`;
    if (key === lastKey.current) return;

    let bounds: LatLngBoundsExpression | null = null;
    if (trackPts.length > 1) {
      bounds = trackPts.map((p) => [p.lat, p.lng] as [number, number]);
      if (selected && hasPosition(selected)) {
        bounds.push([Number(selected.lastPosition.latitude), Number(selected.lastPosition.longitude)]);
      }
    } else if (selected && hasPosition(selected)) {
      const target = map.project([Number(selected.lastPosition.latitude), Number(selected.lastPosition.longitude)], 15);
      // Décale le centre pour que le véhicule reste visible à gauche du panneau.
      map.setView(map.unproject(target.add([rightInset / 2, 0]), 15), 15);
      lastKey.current = key;
      return;
    } else {
      const pts = vehicles
        .filter(hasPosition)
        .map((v) => [Number(v.lastPosition.latitude), Number(v.lastPosition.longitude)] as [number, number]);
      if (pts.length === 1) {
        map.setView(pts[0], 14);
        lastKey.current = key;
        return;
      }
      if (pts.length > 1) bounds = pts;
    }
    if (bounds) {
      map.fitBounds(bounds, { paddingTopLeft: [48, 48], paddingBottomRight: [48 + rightInset, 48], maxZoom: 16 });
      lastKey.current = key;
    }
  }, [map, vehicles, selectedId, track, rightInset]);

  // Le conteneur change de taille (sidebar, feuille mobile) : Leaflet doit recalculer.
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function FollowReplay({ point }: { point: TrackPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point && !map.getBounds().pad(-0.1).contains([point.lat, point.lng])) {
      map.panTo([point.lat, point.lng], { animate: true });
    }
  }, [map, point]);
  return null;
}

export default function FleetMap({
  vehicles,
  selectedId,
  onSelect,
  track,
  replayIndex = null,
  selectedHeading = null,
  rightInset = 0,
  basemap = "plan",
  onMapReady,
  className,
}: FleetMapProps) {
  const positioned = useMemo(() => vehicles.filter(hasPosition), [vehicles]);
  const replayPoint = track && replayIndex !== null ? (track.points[replayIndex] ?? null) : null;
  const start = track?.points[0];
  const end = track && track.points.length > 1 ? track.points[track.points.length - 1] : undefined;

  return (
    // `isolate` : les z-index internes de Leaflet (400 à 1000) ne passent pas au-dessus de l'en-tête et des dialogues.
    <div className={`isolate size-full ${className ?? ""}`}>
      <MapContainer
        ref={(map) => {
          if (map) onMapReady?.(map);
        }}
        center={DEFAULT_CENTER}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="size-full bg-muted"
        attributionControl
      >
        <TileLayer
          key={basemap}
          attribution={BASEMAPS[basemap].attribution}
          url={BASEMAPS[basemap].url}
          maxZoom={BASEMAPS[basemap].maxZoom}
          className={BASEMAPS[basemap].className}
        />
        <FitView vehicles={vehicles} selectedId={selectedId} track={track} rightInset={rightInset} />
        {replayPoint ? <FollowReplay point={replayPoint} /> : null}

        {track?.segments.map((segment, i) => (
          <Polyline
            // biome-ignore lint/suspicious/noArrayIndexKey: tronçons ordonnés et recalculés en bloc
            key={`${segment.band}-${i}`}
            positions={segment.points}
            // `className` doit être passé en prop directe : react-leaflet ne l'applique qu'à la création du tracé.
            className={BAND_CLASS[segment.band]}
            weight={5}
            opacity={0.9}
            lineCap="round"
          />
        ))}

        {start ? (
          <Marker position={[start.lat, start.lng]} icon={startIcon()}>
            <Tooltip direction="top">Départ · {formatDateTime(start.ts)}</Tooltip>
          </Marker>
        ) : null}
        {end ? (
          <Marker position={[end.lat, end.lng]} icon={endIcon()}>
            <Tooltip direction="top">Dernier point · {formatDateTime(end.ts)}</Tooltip>
          </Marker>
        ) : null}
        {track?.stops.map((stop) => (
          <Marker key={stop.from} position={[stop.lat, stop.lng]} icon={stopIcon()}>
            <Tooltip direction="top">
              Arrêt de {formatDuration(stop.duration)} · {formatDateTime(stop.from)}
            </Tooltip>
          </Marker>
        ))}

        {positioned.map((v) => {
          const state = fleetState(v);
          const selected = v.id === selectedId;
          const p = v.lastPosition;
          return (
            <Marker
              key={v.id}
              position={[Number(p.latitude), Number(p.longitude)]}
              icon={vehicleIcon(v.registration, v.vehicleType, state, selected, selected ? selectedHeading : null)}
              zIndexOffset={selected ? 1000 : 0}
              title={v.registration}
              eventHandlers={{ click: () => onSelect?.(v.id) }}
            >
              <Tooltip direction="top" offset={[0, -34]}>
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-semibold">
                    {v.registration} · {FLEET_STATE_META[state].label}
                  </span>
                  <span>
                    {formatNumber(toNumber(p.speedKph), 0)} km/h · contact{" "}
                    {p.ignition === null ? "inconnu" : p.ignition ? "allumé" : "coupé"}
                  </span>
                  <span className="text-muted-foreground">Mis à jour {formatRelative(p.recordedAt)}</span>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {replayPoint ? (
          <Marker position={[replayPoint.lat, replayPoint.lng]} icon={replayIcon()} zIndexOffset={2000}>
            <Tooltip direction="top" permanent offset={[0, -10]}>
              {formatDateTime(replayPoint.ts)} · {formatNumber(replayPoint.speed, 0)} km/h
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
