import { Contact, Cpu, type LucideIcon, ServerCog, SquareParking, Truck, UsersRound } from "lucide-react";

import type { GroupKind } from "@/types/group";

/**
 * Vocabulaire d'une famille de groupes.
 *
 * Les trois écrans (flottes de véhicules, lots de boîtiers, équipes de
 * conducteurs) partagent leurs composants : ce qui change tient dans cet
 * objet — les mots, la route et les icônes.
 */
export interface GroupFamily {
  kind: GroupKind;
  /** Racine de la route, sans barre finale. */
  route: string;
  title: string;
  description: string;
  /** « une flotte », « un lot » — utilisé dans les phrases. */
  singular: string;
  singularWithArticle: string;
  memberSingular: string;
  memberPlural: string;
  /** En-tête de la colonne d'étiquette des membres. */
  memberColumnLabel: string;
  /** Route de détail d'un membre, pour lier la liste au reste du tableau de bord. */
  memberRoute: string;
  /** Longueur minimale de recherche acceptée par l'API des membres. */
  memberSearchMinLength: number;
  memberSearchPlaceholder: string;
  /** Exemple de nom dans le formulaire de création. */
  namePlaceholder: string;
  icon: LucideIcon;
  memberIcon: LucideIcon;
}

export const VEHICLE_GROUP_FAMILY: GroupFamily = {
  kind: "vehicle_group",
  route: "/dashboard/group_vehicle",
  title: "Flottes",
  description: "Regroupez vos véhicules par flotte pour les piloter et les auditer ensemble.",
  singular: "flotte",
  singularWithArticle: "une flotte",
  memberSingular: "véhicule",
  memberPlural: "véhicules",
  memberColumnLabel: "Immatriculation",
  memberRoute: "/dashboard/vehicles",
  memberSearchMinLength: 1,
  memberSearchPlaceholder: "Rechercher une immatriculation…",
  namePlaceholder: "Flotte Abidjan",
  icon: SquareParking,
  memberIcon: Truck,
};

export const DEVICE_GROUP_FAMILY: GroupFamily = {
  kind: "device_group",
  route: "/dashboard/group_device",
  title: "Lots de trackers",
  description: "Regroupez vos boîtiers par lot pour suivre un parc, une campagne ou un déploiement.",
  singular: "lot",
  singularWithArticle: "un lot",
  memberSingular: "boîtier",
  memberPlural: "boîtiers",
  memberColumnLabel: "IMEI",
  memberRoute: "/dashboard/device",
  // L'API des boîtiers refuse une recherche de moins de 3 caractères.
  memberSearchMinLength: 3,
  memberSearchPlaceholder: "Rechercher un IMEI (3 caractères minimum)…",
  namePlaceholder: "Trackers MV730",
  icon: ServerCog,
  memberIcon: Cpu,
};

export const DRIVER_GROUP_FAMILY: GroupFamily = {
  kind: "driver_group",
  route: "/dashboard/group_driver",
  title: "Équipes de conducteurs",
  description:
    "Regroupez vos conducteurs par équipe, site ou horaire. Un conducteur sans organisation n'entre dans aucune équipe.",
  singular: "équipe",
  singularWithArticle: "une équipe",
  memberSingular: "conducteur",
  memberPlural: "conducteurs",
  memberColumnLabel: "Conducteur",
  memberRoute: "/dashboard/driver",
  memberSearchMinLength: 1,
  memberSearchPlaceholder: "Rechercher un nom, un matricule ou un permis…",
  namePlaceholder: "Équipe de nuit",
  icon: UsersRound,
  memberIcon: Contact,
};

export const groupFamilies: Record<GroupKind, GroupFamily> = {
  vehicle_group: VEHICLE_GROUP_FAMILY,
  device_group: DEVICE_GROUP_FAMILY,
  driver_group: DRIVER_GROUP_FAMILY,
};
