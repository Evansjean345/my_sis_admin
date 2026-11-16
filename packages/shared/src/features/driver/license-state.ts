/** Permis expiré ou expirant sous 30 jours : à signaler dans la liste et sur la fiche. */
export function licenseState(expiresOn: string | null): "expired" | "soon" | null {
  if (!expiresOn) return null;
  const days = (new Date(expiresOn).getTime() - Date.now()) / 86_400_000;
  if (days < 0) return "expired";
  return days <= 30 ? "soon" : null;
}
