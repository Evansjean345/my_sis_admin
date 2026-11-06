import axios, { type AxiosError, type AxiosInstance } from "axios";

import { clearSession, getToken } from "@/lib/auth-token";
import { ApiError, type ApiErrorBody } from "@/types/api";

/**
 * Client HTTP unique de l'application.
 *
 * - base : `${NEXT_PUBLIC_URL}/api/v1`
 * - ajoute `Authorization: Bearer <token>` sur chaque requête
 * - ajoute `ngrok-skip-browser-warning` : sans lui, un tunnel ngrok renvoie
 *   une page HTML d'avertissement au lieu du JSON de l'API
 * - normalise toutes les erreurs en `ApiError { status, code, message, details }`
 * - sur 401 : purge la session et renvoie vers la page de connexion
 */
const API_URL = (process.env.NEXT_PUBLIC_URL ?? "").replace(/\/+$/, "");
/**
 * Préfixe des routes du tableau de bord d'administration (`/api/v1/admin/*`) :
 * périmètre plateforme, toutes organisations, joker `*` exigé.
 */
export const prefixAdmin = "admin";

/** `adminPath("/vehicles")` → `/admin/vehicles` */
export const adminPath = (path: string): string => `/${prefixAdmin}${path.startsWith("/") ? path : `/${path}`}`;

export const LOGIN_PATH = "/auth/v2/login";

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorBody).error === "object" &&
    (body as ApiErrorBody).error !== null
  );
}

function fallbackMessage(status: number): string {
  if (status === 0) return "Serveur injoignable. Vérifiez votre connexion ou l'URL de l'API.";
  if (status === 401) return "Session expirée. Veuillez vous reconnecter.";
  if (status === 403) return "Vous n'avez pas les droits nécessaires pour cette action.";
  if (status === 404) return "Ressource introuvable.";
  if (status === 409) return "Conflit : l'opération n'est pas possible dans l'état actuel.";
  if (status === 422) return "Les données transmises sont invalides.";
  if (status === 429) return "Trop de requêtes. Patientez une minute avant de réessayer.";
  if (status >= 500) return "Erreur serveur. Réessayez dans un instant.";
  return "Une erreur inattendue est survenue.";
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (status === 401 && typeof window !== "undefined") {
      const isLoginCall = error.config?.url?.includes("/auth/login");
      if (!isLoginCall) {
        clearSession();
        if (!window.location.pathname.startsWith(LOGIN_PATH)) {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`${LOGIN_PATH}?next=${next}`);
        }
      }
    }

    if (isApiErrorBody(body)) {
      const { code, message, details } = body.error;
      return Promise.reject(new ApiError(status, code, message || fallbackMessage(status), details ?? {}));
    }

    const code = status === 0 ? "E_NETWORK" : status === 429 ? "E_TOO_MANY_REQUESTS" : `E_HTTP_${status}`;
    return Promise.reject(new ApiError(status, code, fallbackMessage(status)));
  },
);

/** Message lisible pour un toast, quelle que soit l'erreur. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = error.fieldErrors[0];
    return first ? `${error.message} — ${first.field} : ${first.message}` : error.message;
  }
  if (error instanceof Error) return error.message;
  return "Une erreur inattendue est survenue.";
}
