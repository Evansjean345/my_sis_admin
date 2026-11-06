"use client";

import { DEVICE_GROUP_FAMILY } from "../_components/groups/group-family";
import { GroupsScreen } from "../_components/groups/groups-screen";

export default function Page() {
  return <GroupsScreen family={DEVICE_GROUP_FAMILY} />;
}
