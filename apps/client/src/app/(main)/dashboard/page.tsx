import { Suspense } from "react";

import { LoadingRows } from "@shared/components/query-state";
import { OperatorDashboard } from "@shared/features/home-operator/operator-dashboard";

/** Accueil de l'espace Client (niveau 3). */
export default function Page() {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      <OperatorDashboard />
    </Suspense>
  );
}
