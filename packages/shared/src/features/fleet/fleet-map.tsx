"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@shared/components/ui/skeleton";
import type { FleetMapProps } from "@shared/features/fleet/map";

/** Leaflet manipule `window` : la carte n'est rendue que côté navigateur. */
export const FleetMap = dynamic<FleetMapProps>(() => import("@shared/features/fleet/map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});
