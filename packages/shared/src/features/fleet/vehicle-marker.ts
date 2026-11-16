import { createElement } from "react";

import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

import { FLEET_STATE_SWATCH, type FleetState, VEHICLE_ICONS } from "@shared/features/fleet/fleet-state";
import type { VehicleType } from "@shared/types/vehicle";

const cache = new Map<string, L.DivIcon>();

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Étiquette véhicule posée sur la carte : pastille colorée (état) avec le
 * pictogramme du type, suivie de l'immatriculation. Ancrée par sa pointe
 * basse sur la position. Mise en cache : Leaflet recrée le DOM à chaque changement d'icône.
 */
export function vehicleIcon(
  registration: string,
  type: VehicleType,
  state: FleetState,
  selected: boolean,
  heading: number | null,
): L.DivIcon {
  const roundedHeading = heading === null ? "-" : Math.round(heading / 5) * 5;
  const key = `${registration}|${type}|${state}|${selected}|${roundedHeading}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const glyph = renderToStaticMarkup(
    createElement(VEHICLE_ICONS[type] ?? VEHICLE_ICONS.other, { size: 13, strokeWidth: 2.25 }),
  );
  const arrow =
    heading === null || (state !== "moving" && state !== "alert")
      ? ""
      : `<span class="flex size-4 items-center justify-center text-muted-foreground" style="transform:rotate(${roundedHeading}deg)"><svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0 9 10 5 7.5 1 10z"/></svg></span>`;

  const html = `<div class="fleet-label pointer-events-auto absolute bottom-0 left-0 flex -translate-x-1/2 flex-col items-center">
  <div class="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-popover py-1 pr-2 pl-1 font-semibold text-[11px] text-popover-foreground shadow-md ring-1 ${
    selected ? "ring-2 ring-primary" : "ring-border"
  }">
    <span class="flex size-5 items-center justify-center rounded ${FLEET_STATE_SWATCH[state]}">${glyph}</span>
    <span class="tracking-tight">${escapeHtml(registration)}</span>${arrow}
  </div>
  <span class="size-0 border-x-[5px] border-t-[6px] border-x-transparent ${
    selected ? "border-t-primary" : "border-t-popover"
  }"></span>
</div>`;

  const icon = L.divIcon({
    html,
    className: "fleet-marker",
    // Taille nulle : l'étiquette se positionne elle-même au-dessus du point d'ancrage.
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -34],
    tooltipAnchor: [0, -34],
  });
  cache.set(key, icon);
  return icon;
}

function dot(className: string, label: string) {
  return L.divIcon({
    html: `<div class="flex size-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow ${className}">${label}</div>`,
    className: "fleet-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export const startIcon = () => dot("bg-emerald-600", "A");
export const endIcon = () => dot("bg-rose-600", "B");
export const stopIcon = () =>
  L.divIcon({
    html: '<div class="flex size-5 items-center justify-center rounded-sm border-2 border-white bg-amber-500 text-[9px] font-bold text-white shadow">P</div>',
    className: "fleet-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
export const replayIcon = () =>
  L.divIcon({
    html: '<div class="size-4 rounded-full border-2 border-white bg-primary shadow-lg ring-4 ring-primary/30"></div>',
    className: "fleet-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
