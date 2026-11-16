import { createDashboardProxy } from "@shared/lib/access/proxy";

/** Espace Super Admin : n'ouvre le tableau de bord qu'aux comptes de niveau 1. */
export const proxy = createDashboardProxy(1);

export const config = {
  matcher: ["/dashboard/:path*"],
};
