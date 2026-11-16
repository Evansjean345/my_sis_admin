import { type NextRequest, NextResponse } from "next/server";

import { ACCESS_LEVEL_COOKIE, type AccessLevel, homeOf, parseLevel } from "@shared/lib/access/levels";
import { AUTH_TOKEN_COOKIE } from "@shared/lib/auth-token";

const LOGIN_PATH = "/auth/v2/login";

/**
 * Proxy Next.js d'une application de tableau de bord (un niveau = une appli).
 *
 *  - pas de jeton → page de connexion de CETTE application (avec `?next=`) ;
 *  - cookie de niveau d'un autre espace → page de connexion (l'écran explique
 *    où se connecter) ;
 *  - `/dashboard` → accueil de l'application quand il est ailleurs (niveau 1).
 *
 * Confort de navigation uniquement : l'API contrôle les habilitations du jeton
 * à chaque appel, et `AccessProvider` revérifie le niveau avec `/auth/me`.
 *
 * Usage, dans `apps/<appli>/src/proxy.ts` (le `config.matcher` doit rester un
 * littéral dans le fichier de l'application) :
 *
 *   export const proxy = createDashboardProxy(2);
 *   export const config = { matcher: ["/dashboard/:path*"] };
 */
export function createDashboardProxy(appLevel: AccessLevel) {
  return function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;

    if (!token) {
      const url = new URL(LOGIN_PATH, req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }

    const level = parseLevel(req.cookies.get(ACCESS_LEVEL_COOKIE)?.value);
    // Session ouverte avant les niveaux : AccessProvider tranchera après /auth/me.
    if (level !== null && level !== appLevel) {
      return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
    }

    const home = homeOf(appLevel);
    if ((pathname === "/dashboard" || pathname === "/dashboard/") && home !== "/dashboard") {
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  };
}
