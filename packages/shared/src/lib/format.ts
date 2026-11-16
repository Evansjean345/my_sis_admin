import { format, formatDistanceToNowStrict, isValid } from "date-fns";
import { fr } from "date-fns/locale";

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return isValid(date) ? date : null;
}

/** 13 sept. 2026, 12:34 */
export function formatDateTime(value: string | number | Date | null | undefined, fallback = "—"): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, HH:mm", { locale: fr }) : fallback;
}

/** 13 sept. 2026 */
export function formatDate(value: string | number | Date | null | undefined, fallback = "—"): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy", { locale: fr }) : fallback;
}

/** il y a 5 minutes */
export function formatRelative(value: string | number | Date | null | undefined, fallback = "jamais"): string {
  const date = toDate(value);
  return date ? `il y a ${formatDistanceToNowStrict(date, { locale: fr })}` : fallback;
}

/** Horodatage flespi (secondes epoch, éventuellement décimales). */
export function fromFlespiTs(ts: number | null | undefined): Date | null {
  return typeof ts === "number" && Number.isFinite(ts) ? new Date(ts * 1000) : null;
}

/** Les décimaux PostgreSQL arrivent en chaîne (« 90.00 »). */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function formatNumber(value: string | number | null | undefined, digits = 0, fallback = "—"): string {
  const n = toNumber(value);
  return n === null
    ? fallback
    : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
}

/** Export CSV côté client (séparateur « ; » pour Excel FR). */
export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(";"), ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(";"))].join("\n");
  const blob = new Blob([String.fromCharCode(0xfeff), csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
