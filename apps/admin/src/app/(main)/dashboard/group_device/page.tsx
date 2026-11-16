"use client";

import { DEVICE_GROUP_FAMILY } from "@shared/features/common/groups/group-family";
import { GroupsScreen } from "@shared/features/common/groups/groups-screen";

export default function Page() {
  return <GroupsScreen family={DEVICE_GROUP_FAMILY} />;
}
