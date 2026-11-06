import { DriverDetail } from "./_components/driver-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DriverDetail id={id} />;
}
