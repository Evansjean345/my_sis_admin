import { ScheduleDetail } from "./_components/schedule-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ScheduleDetail id={id} />;
}
