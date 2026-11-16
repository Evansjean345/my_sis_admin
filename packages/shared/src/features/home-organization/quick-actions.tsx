"use client";

import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import { CarFront, CarTaxiFront, Clock3, Link2, UserPlus, UsersRound } from "lucide-react";

import { useAccess } from "@shared/components/providers/access-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";

interface Action {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  permission: string;
}

/**
 * Raccourcis de gestion de l'organisation. Pas de « Nouveau tracker » :
 * l'enregistrement des boîtiers reste chez l'exploitant (POST /devices
 * répond 403 E_PLATFORM_ONLY) ; l'administrateur les MONTE sur ses véhicules.
 */
const ACTIONS: Action[] = [
  {
    href: "/dashboard/vehicles",
    label: "Ajouter un véhicule",
    hint: "Immatriculation, seuil de vitesse, immobilisation",
    icon: CarFront,
    permission: "vehicle:write",
  },
  {
    href: "/dashboard/group_vehicle",
    label: "Créer une flotte",
    hint: "Regrouper des véhicules pour les piloter ensemble",
    icon: CarTaxiFront,
    permission: "vehicle:write",
  },
  {
    href: "/dashboard/device",
    label: "Monter un tracker",
    hint: "Affecter un boîtier de votre parc à un véhicule",
    icon: Link2,
    permission: "device:write",
  },
  {
    href: "/dashboard/users",
    label: "Inviter un utilisateur",
    hint: "Administrateur ou opérateur de votre organisation",
    icon: UserPlus,
    permission: "user:write",
  },
  {
    href: "/dashboard/driver",
    label: "Gérer les conducteurs",
    hint: "Permis, véhicule attribué, équipes",
    icon: UsersRound,
    permission: "vehicle:write",
  },
  {
    href: "/dashboard/clock",
    label: "Programmer des horaires",
    hint: "Immobilisation automatique hors plages",
    icon: Clock3,
    permission: "policy:write",
  },
];

export function QuickActions() {
  const { can } = useAccess();
  const actions = ACTIONS.filter((a) => can(a.permission));
  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion rapide</CardTitle>
        <CardDescription>Les opérations courantes de votre organisation</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.href + a.label}
            href={a.href}
            prefetch={false}
            className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <a.icon className="size-4" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-medium text-sm">{a.label}</span>
              <span className="text-muted-foreground text-xs">{a.hint}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
