import { VehicleDetailView } from "./_components/vehicle-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VehicleDetailView id={id} />;
}
