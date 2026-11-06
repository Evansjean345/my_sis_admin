import {
  Banknote,
  BellRing,
  BuildingComplex,
  CarBattery,
  CarIcon,
  CarTaxiFront,
  Clock3,
  Cpu,
  FileText,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Lock,
  type LucideIcon,
  Mail,
  Map as MapIcon,
  MapPin,
  MapPinned,
  ReceiptText,
  Server,
  ServerCog,
  ShieldCog,
  SquareParking,
  TriangleAlert,
  Truck,
  UserGroupIcon,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        id: "default",
        title: "Home",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "billing",
        title: "Facturation",
        url: "/dashboard/billing",
        icon: Banknote,
      },
      {
        id: "fleet",
        title: "Tracking GPS",
        url: "/dashboard/fleet",
        icon: MapPinned,
      },
      {
        id: "zone",
        title: "Zone géographiques",
        url: "/dashboard/zone",
        icon: MapIcon,
      },
      {
        id: "speed",
        title: "Contrôle des vitesses",
        url: "/dashboard/speed",
        icon: Gauge,
      },
      {
        id: "clock",
        title: "Gestion des horaires",
        url: "/dashboard/clock",
        icon: Clock3,
      },
      {
        id: "email",
        title: "Centres d'alertes SMS",
        url: "/dashboard/mail",
        icon: BellRing,
      },
      {
        id: "incident",
        title: "Gestion des incidents",
        url: "/dashboard/incidents",
        icon: TriangleAlert,
      },
      {
        id: "channel",
        title: "Canal de transmission",
        url: "/dashboard/channel",
        icon: Server,
      },
      {
        id: "vehicles",
        title: "Véhicules",
        url: "/dashboard/vehicles",
        icon: CarIcon,
      },
      {
        id: "device",
        title: "Trackers",
        url: "/dashboard/device",
        icon: CarBattery,
      },
      {
        id: "entreprises",
        title: "Entreprises",
        url: "/dashboard/entreprises",
        icon: BuildingComplex,
      },
      {
        id: "group_device",
        title: "Lots de trackers",
        url: "/dashboard/group_device",
        icon: ServerCog,
      },
      {
        id: "group_vehicle",
        title: "Administrer une Flotte",
        url: "/dashboard/group_vehicle",
        icon: CarTaxiFront,
      },
      {
        id: "audit",
        title: "Rapports et Exports",
        url: "/dashboard/audit",
        icon: FileText,
      },
      {
        id: "driver",
        title: "Conducteurs",
        url: "/dashboard/driver",
        icon: UserGroupIcon,
      },
      {
        id: "group_driver",
        title: "Équipes de conducteurs",
        url: "/dashboard/group_driver",
        icon: UsersRound,
      },
    ],
  },
  {
    id: 2,
    label: "Utilsateurs & Permissions",
    items: [
      {
        id: "invoice",
        title: "Factures",
        url: "/dashboard/invoice",
        icon: ReceiptText,
      },
      {
        id: "profile",
        title: "Mon profil",
        url: "/dashboard/profile",
        icon: UserRound,
      },
      {
        id: "users",
        title: "Utilisateurs",
        url: "/dashboard/users",
        icon: Users,
      },
      {
        id: "roles",
        title: "Rôles et permissions",
        url: "/dashboard/roles",
        icon: Lock,
      },
    ],
  },
];
