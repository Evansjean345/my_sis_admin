"use client";

import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import { Cpu, Server, ShieldCheck, Truck, Users } from "lucide-react";

import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { Card, CardContent } from "@shared/components/ui/card";
import type { AccessLevel } from "@shared/lib/access/levels";

/** Raccourcis : seulement vers les écrans qui existent dans l'application du niveau. */
const LINKS: Array<{ href: string; label: string; description: string; icon: LucideIcon; levels: AccessLevel[] }> = [
  {
    href: "/dashboard/vehicles",
    label: "Véhicules",
    description: "Flotte et immobilisation",
    icon: Truck,
    levels: [1, 2, 3],
  },
  { href: "/dashboard/device", label: "Trackers", description: "Boîtiers et commandes", icon: Cpu, levels: [1, 2, 3] },
  {
    href: "/dashboard/channel",
    label: "Canal flespi",
    description: "Connexions et journaux",
    icon: Server,
    levels: [1],
  },
  { href: "/dashboard/users", label: "Utilisateurs", description: "Comptes et accès", icon: Users, levels: [1, 2] },
  { href: "/dashboard/roles", label: "Rôles", description: "Permissions", icon: ShieldCheck, levels: [1, 2] },
];

export function FleetQuickLinks() {
  const level = useOptionalAccess()?.level ?? 1;
  const links = LINKS.filter((l) => l.levels.includes(level));
  return (
    <nav aria-label="Raccourcis" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {links.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className="group rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Card size="sm" className="h-full transition-colors group-hover:bg-muted/50">
            <CardContent className="flex flex-col items-center gap-2 py-2 text-center">
              <span className="flex size-10 items-center justify-center rounded-full border bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                <Icon className="size-5" />
              </span>
              <span className="font-medium text-sm">{label}</span>
              <span className="text-muted-foreground text-xs">{description}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </nav>
  );
}
