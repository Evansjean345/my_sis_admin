import { Suspense } from "react";

import { LoadingRows } from "@shared/components/query-state";
import { OrganizationDashboard } from "@shared/features/home-organization/organization-dashboard";

/** Accueil de l'espace Administration (niveau 2). */
export default function Page() {
  return (
    // `useSearchParams` (fenêtre d'activité) exige une frontière Suspense au build.
    <Suspense fallback={<LoadingRows rows={8} />}>
      <OrganizationDashboard />
    </Suspense>
  );
}
