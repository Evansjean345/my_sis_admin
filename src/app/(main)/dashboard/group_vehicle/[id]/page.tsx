"use client";

import { use } from "react";

import { GroupDetailScreen } from "../../_components/groups/group-detail-screen";
import { VEHICLE_GROUP_FAMILY } from "../../_components/groups/group-family";

/**
 * Page CLIENT : la famille de groupe porte des composants d'icône, qu'une page
 * serveur ne peut pas transmettre. `use(params)` lit la promesse des paramètres.
 */
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GroupDetailScreen family={VEHICLE_GROUP_FAMILY} id={id} />;
}
