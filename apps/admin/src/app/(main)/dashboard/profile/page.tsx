import { Suspense } from "react";

import { LoadingRows } from "@shared/components/query-state";
import { Profile } from "@shared/features/profile/profile";

export default function Page() {
  return (
    <div className="flex flex-col gap-4 py-4" data-content-padding="false">
      <Suspense fallback={<LoadingRows rows={6} />}>
        <Profile />
      </Suspense>
    </div>
  );
}
