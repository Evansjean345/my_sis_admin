import { Suspense } from "react";

import { Skeleton } from "@shared/components/ui/skeleton";
import { Fleet } from "@shared/features/fleet/fleet";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-[70dvh] rounded-xl" />}>
      <Fleet />
    </Suspense>
  );
}
