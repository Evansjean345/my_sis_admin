import { DriverDetail } from "@shared/features/driver/detail/driver-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriverDetail id={id} />;
}
