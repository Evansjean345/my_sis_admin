import { createDashboardProxy } from "@shared/lib/access/proxy";

/** Espace Client : n'ouvre le tableau de bord qu'aux comptes de niveau 3. */
export const proxy = createDashboardProxy(3);

export const config = {
  matcher: ["/dashboard/:path*"],
};
