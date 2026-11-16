/**
 * =========================================================================
 *  NIVEAUX D'ACCÈS — règles pures, partagées par le navigateur et `proxy.ts`
 * =========================================================================
 *
 * Les trois rôles système de l'API (migration 016) ne changent pas :
 *
 *   niveau 1  super_admin  joker `*`          exploitant de la plateforme
 *   niveau 2  admin        `vehicle:*`, …     administrateur d'une organisation
 *   niveau 3  operator     lecture + coupure  client final
 *
 * Le niveau ne décide QUE de l'interface : quel tableau de bord, quels menus,
 * quelles actions afficher. L'API reste seule juge : masquer n'est pas
 * autoriser, et un cookie de niveau falsifié n'ouvre aucun droit.
 *
 * Chaque niveau a SON application (monorepo `apps/superadmin`, `apps/admin`,
 * `apps/client`), déployée séparément. Une application n'accepte que les
 * comptes de son niveau et renvoie les autres vers la bonne adresse.
 *
 * Aucune dépendance au DOM ni à React : ce fichier est importé par le proxy
 * Next.js (runtime serveur) comme par les composants.
 */

export type AccessLevel = 1 | 2 | 3;

export const ACCESS_LEVELS = [1, 2, 3] as const satisfies readonly AccessLevel[];

/** Joker absolu : réservé à l'exploitant de la plateforme (même règle que l'API). */
export const PLATFORM_WILDCARD = "*";

/** Cookie posé à la connexion et rafraîchi par `/auth/me` : lu par `proxy.ts`. */
export const ACCESS_LEVEL_COOKIE = "sisbm_level";

export interface LevelMeta {
  level: AccessLevel;
  /** Code du rôle système correspondant. */
  roleCode: "super_admin" | "admin" | "operator";
  label: string;
  /** Libellé court pour les badges. */
  short: string;
  /** Nom de l'espace (application) du niveau. */
  space: string;
  /** Page d'accueil, DANS l'application du niveau. */
  home: string;
  /** Adresse publique de l'application du niveau (variables `NEXT_PUBLIC_*_APP_URL`). */
  appUrl: string | undefined;
}

export const LEVEL_META: Record<AccessLevel, LevelMeta> = {
  1: {
    level: 1,
    roleCode: "super_admin",
    label: "Super administrateur",
    short: "Plateforme",
    space: "Espace Super Admin",
    home: "/dashboard/default",
    appUrl: process.env.NEXT_PUBLIC_SUPERADMIN_APP_URL,
  },
  2: {
    level: 2,
    roleCode: "admin",
    label: "Administrateur",
    short: "Organisation",
    space: "Espace Administration",
    home: "/dashboard",
    appUrl: process.env.NEXT_PUBLIC_ADMIN_APP_URL,
  },
  3: {
    level: 3,
    roleCode: "operator",
    label: "Opérateur",
    short: "Client final",
    space: "Espace Client",
    home: "/dashboard",
    appUrl: process.env.NEXT_PUBLIC_CLIENT_APP_URL,
  },
};

/**
 * Habilitations des rôles système, telles que figées par la migration 016.
 * Sert de valeur par défaut tant que `/auth/me` n'a pas répondu : l'interface
 * s'affiche tout de suite avec les bons boutons, puis s'aligne sur les
 * habilitations réelles du compte.
 */
export const LEVEL_DEFAULT_PERMISSIONS: Record<AccessLevel, readonly string[]> = {
  1: [PLATFORM_WILDCARD],
  2: [
    "vehicle:*",
    "device:*",
    "user:*",
    "geofence:*",
    "policy:*",
    "alert:*",
    "incident:*",
    "report:*",
    "command:*",
    "audit:read",
  ],
  3: [
    "vehicle:read",
    "device:read",
    "geofence:read",
    "alert:read",
    "incident:read",
    "report:read",
    "command:immobilize",
  ],
};

/**
 * Vrai si `granted` couvre `required` — copie conforme de `covers()` côté API
 * (`app/domain/identity/role_policy.ts`) : jokers `*` et `ressource:*`.
 */
export function covers(granted: readonly string[], required: string): boolean {
  if (granted.includes(PLATFORM_WILDCARD)) return true;
  if (required === PLATFORM_WILDCARD) return false;
  if (granted.includes(required)) return true;
  const [resource] = required.split(":");
  return granted.includes(`${resource}:*`);
}

/**
 * Niveau d'un compte. Le joker `*` prime (c'est ce que l'API appelle
 * `isPlatform`) ; puis le code du rôle système ; enfin, pour un rôle propre à
 * une organisation, ses habilitations d'écriture.
 */
export function levelOf(input: { roleCode?: string | null; permissions?: readonly string[] | null }): AccessLevel {
  const permissions = input.permissions ?? [];
  if (permissions.includes(PLATFORM_WILDCARD) || input.roleCode === "super_admin") return 1;
  if (input.roleCode === "admin") return 2;
  if (input.roleCode === "operator") return 3;
  return covers(permissions, "user:write") || covers(permissions, "vehicle:write") ? 2 : 3;
}

export function parseLevel(raw: string | null | undefined): AccessLevel | null {
  const n = Number(raw);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

/* ------------------------------------------------------------------ espaces */

export function homeOf(level: AccessLevel): string {
  return LEVEL_META[level].home;
}

/** Adresse de connexion de l'application d'un niveau (`undefined` si non configurée). */
export function loginUrlOf(level: AccessLevel): string | undefined {
  const base = LEVEL_META[level].appUrl?.replace(/\/+$/, "");
  return base ? `${base}/auth/v2/login` : undefined;
}
