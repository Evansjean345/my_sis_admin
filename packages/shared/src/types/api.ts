/**
 * Contrats génériques de l'API SISBM CORE.
 *
 * Toutes les réponses sont enveloppées dans `data` (et éventuellement `meta`).
 * Les erreurs suivent un format unique : `{ error: { code, message, details } }`.
 * Le `code` est le contrat stable ; le `message` est destiné aux humains.
 */

export interface ApiResponse<T, M = undefined> {
  data: T;
  meta?: M;
}

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}

export interface Paginated<T> {
  meta: PaginationMeta;
  data: T[];
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Erreur normalisée renvoyée par l'intercepteur axios. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Messages de validation VineJS : `details.fields = [{ field, message }]`. */
  get fieldErrors(): Array<{ field: string; message: string }> {
    const fields = this.details.fields;
    return Array.isArray(fields) ? (fields as Array<{ field: string; message: string }>) : [];
  }
}
