import { CarBattery, CarIcon, CarTaxiFront, Clock3, MapPinned, Radar, UserGroupIcon, UserRound } from "lucide-react";

import type { NavGroup } from "@shared/navigation/types";

/**
 * Niveau 3 — opérateur, client final : suivi et consultation. Aucune création
 * d'utilisateur, de tracker, de flotte ni de véhicule ; la coupure moteur
 * reste possible (habilitation `command:immobilize`).
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Suivi",
    items: [
      { id: "client-home", title: "Mon espace", url: "/dashboard", icon: Radar },
      { id: "fleet", title: "Tracking GPS", url: "/dashboard/fleet", icon: MapPinned },
      { id: "clock", title: "Horaires d'utilisation", url: "/dashboard/clock", icon: Clock3 },
    ],
  },
  {
    id: 2,
    label: "Mon parc",
    items: [
      { id: "vehicles", title: "Véhicules", url: "/dashboard/vehicles", icon: CarIcon },
      { id: "group_vehicle", title: "Flottes", url: "/dashboard/group_vehicle", icon: CarTaxiFront },
      { id: "device", title: "Trackers", url: "/dashboard/device", icon: CarBattery },
      { id: "driver", title: "Conducteurs", url: "/dashboard/driver", icon: UserGroupIcon },
    ],
  },
  {
    id: 3,
    label: "Compte",
    items: [{ id: "profile", title: "Mon profil", url: "/dashboard/profile", icon: UserRound }],
  },
];
