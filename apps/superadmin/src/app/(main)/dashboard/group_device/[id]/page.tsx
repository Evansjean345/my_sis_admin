"use client";

import { use } from "react";

import { GroupDetailScreen } from "@shared/features/common/groups/group-detail-screen";
import { DEVICE_GROUP_FAMILY } from "@shared/features/common/groups/group-family";

/**
 * Page CLIENT : la famille de groupe porte des composants d'icône, qu'une page
 * serveur ne peut pas transmettre. `use(params)` lit la promesse des paramètres.
 */
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <GroupDetailScreen family={DEVICE_GROUP_FAMILY} id={id} />;
}
