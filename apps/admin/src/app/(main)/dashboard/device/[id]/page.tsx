import { Suspense } from "react";

import { LoadingRows } from "@shared/components/query-state";
import { DeviceDetailView } from "@shared/features/device/detail/device-detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <DeviceDetailView id={id} />
    </Suspense>
  );
}
