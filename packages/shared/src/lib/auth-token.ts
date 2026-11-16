import { ACCESS_LEVEL_COOKIE, type AccessLevel, parseLevel } from "@shared/lib/access/levels";
import { deleteClientCookie, getClientCookie, setClientCookie } from "@shared/lib/cookie.client";
import type { AuthSession, AuthUser } from "@shared/types/auth";

/**
 * Stockage de la session côté navigateur.
 *
 * Le jeton est posé dans un cookie (et non en localStorage) pour que
 * `src/proxy.ts` puisse protéger les routes du dashboard AVANT le rendu.
 * Il reste lisible en JS : c'est l'intercepteur axios qui l'ajoute en
 * `Authorization: Bearer` sur chaque requête.
 */
export const AUTH_TOKEN_COOKIE = "sisbm_token";
const AUTH_USER_COOKIE = "sisbm_user";

function daysUntil(expiresAt: string | undefined): number {
  if (!expiresAt) return 7;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) && ms > 0 ? ms / 864e5 : 7;
}

export function saveSession(session: AuthSession): void {
  const days = daysUntil(session.expiresAt);
  setClientCookie(AUTH_TOKEN_COOKIE, encodeURIComponent(session.token), days);
  setClientCookie(AUTH_USER_COOKIE, encodeURIComponent(JSON.stringify(session.user)), days);
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const raw = getClientCookie(AUTH_TOKEN_COOKIE);
  return raw ? decodeURIComponent(raw) : null;
}

export function getStoredUser(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const raw = getClientCookie(AUTH_USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Niveau d'accès (1 plateforme, 2 organisation, 3 client final).
 *
 * Posé à la connexion puis réaligné sur chaque `/auth/me`. Il sert à
 * `src/proxy.ts` (bon tableau de bord dès la première requête) et au choix du
 * périmètre d'API (`scopedPath`). Ce n'est PAS un droit : l'API vérifie les
 * habilitations du jeton à chaque appel.
 */
export function saveAccessLevel(level: AccessLevel, expiresAt?: string): void {
  setClientCookie(ACCESS_LEVEL_COOKIE, String(level), daysUntil(expiresAt));
}

export function getAccessLevel(): AccessLevel | null {
  if (typeof document === "undefined") return null;
  return parseLevel(getClientCookie(ACCESS_LEVEL_COOKIE));
}

export function clearSession(): void {
  deleteClientCookie(AUTH_TOKEN_COOKIE);
  deleteClientCookie(AUTH_USER_COOKIE);
  deleteClientCookie(ACCESS_LEVEL_COOKIE);
}
