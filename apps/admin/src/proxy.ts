import { createDashboardProxy } from "@shared/lib/access/proxy";

/** Espace Administration : n'ouvre le tableau de bord qu'aux comptes de niveau 2. */
export const proxy = createDashboardProxy(2);

export const config = {
  matcher: ["/dashboard/:path*"],
};
