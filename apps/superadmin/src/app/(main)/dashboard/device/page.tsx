import { Devices, type DeviceView } from "@shared/features/device/devices";

interface PageProps {
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { view } = await searchParams;
  const activeView: DeviceView = view === "list" ? "list" : "grid";
  return <Devices view={activeView} />;
}
