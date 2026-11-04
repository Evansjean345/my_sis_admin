import type { Role } from "@/types/role";

/** Ligne de table : rôle API enrichi du groupe d'affichage et du nombre d'utilisateurs. */
export type RoleRow = Role & {
  group: string;
  usersCount: number | null;
};

export const SYSTEM_GROUP = "Rôles système";
export const CUSTOM_GROUP = "Rôles personnalisés";

/** Ressources connues, dans l'ordre d'affichage de la matrice. */
export const PERMISSION_RESOURCES = [
  "vehicle",
  "device",
  "user",
  "geofence",
  "policy",
  "alert",
  "incident",
  "report",
  "command",
  "audit",
] as const;

export type AccessLevel = "full" | "partial" | "read" | "none";

/** Niveau d'accès d'un rôle sur une ressource, à partir de ses permissions (« * », « res:* », « res:read »…). */
export function accessLevel(permissions: string[], resource: string): { level: AccessLevel; actions: string[] } {
  if (permissions.includes("*") || permissions.includes(`${resource}:*`)) return { level: "full", actions: ["*"] };
  const actions = permissions.filter((p) => p.startsWith(`${resource}:`)).map((p) => p.split(":")[1]);
  if (actions.length === 0) return { level: "none", actions };
  if (actions.length === 1 && actions[0] === "read") return { level: "read", actions };
  return { level: "partial", actions };
}
