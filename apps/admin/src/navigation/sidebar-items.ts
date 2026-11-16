import {
  Building2,
  CarBattery,
  CarIcon,
  CarTaxiFront,
  Clock3,
  FileText,
  LayoutDashboard,
  Lock,
  MapPinned,
  ServerCog,
  UserGroupIcon,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

import type { NavGroup } from "@shared/navigation/types";

/** Niveau 2 — administrateur : gestion complète de son organisation. */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Supervision",
    items: [
      { id: "org-home", title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
      { id: "fleet", title: "Tracking GPS", url: "/dashboard/fleet", icon: MapPinned },
      { id: "clock", title: "Gestion des horaires", url: "/dashboard/clock", icon: Clock3 },
      { id: "audit", title: "Rapports et Exports", url: "/dashboard/audit", icon: FileText },
    ],
  },
  {
    id: 2,
    label: "Parc",
    items: [
      { id: "vehicles", title: "Véhicules", url: "/dashboard/vehicles", icon: CarIcon },
      { id: "group_vehicle", title: "Flottes", url: "/dashboard/group_vehicle", icon: CarTaxiFront },
      { id: "device", title: "Trackers", url: "/dashboard/device", icon: CarBattery },
      { id: "group_device", title: "Lots de trackers", url: "/dashboard/group_device", icon: ServerCog },
      { id: "driver", title: "Conducteurs", url: "/dashboard/driver", icon: UserGroupIcon },
      { id: "group_driver", title: "Équipes de conducteurs", url: "/dashboard/group_driver", icon: UsersRound },
    ],
  },
  {
    id: 3,
    label: "Organisation",
    items: [
      { id: "organization", title: "Mon organisation", url: "/dashboard/organization", icon: Building2 },
      { id: "users", title: "Utilisateurs", url: "/dashboard/users", icon: Users },
      { id: "roles", title: "Rôles et permissions", url: "/dashboard/roles", icon: Lock },
      { id: "profile", title: "Mon profil", url: "/dashboard/profile", icon: UserRound },
    ],
  },
];
