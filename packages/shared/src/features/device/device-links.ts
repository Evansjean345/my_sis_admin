export type DeviceTab = "overview" | "telemetry" | "commands" | "diagnostic" | "logs";

export function deviceHref(id: string, tab?: DeviceTab): string {
  return tab && tab !== "overview" ? `/dashboard/device/${id}?tab=${tab}` : `/dashboard/device/${id}`;
}
