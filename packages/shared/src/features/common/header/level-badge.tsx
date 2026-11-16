"use client";

import { Building2, Globe2, UserRound } from "lucide-react";

import { useAccess } from "@shared/components/providers/access-provider";
import { Badge } from "@shared/components/ui/badge";

const ICONS = { 1: Globe2, 2: Building2, 3: UserRound } as const;

/** Niveau du tableau de bord affiché + organisation du compte (niveaux 2 et 3). */
export function LevelBadge() {
  const { level, meta, organizationName } = useAccess();
  const Icon = ICONS[level];
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Badge variant="outline" className="gap-1.5 rounded-full">
        <Icon className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Niveau {level} ·</span> {meta.short}
      </Badge>
      {level !== 1 && organizationName ? (
        <span className="hidden truncate font-medium text-sm md:inline">{organizationName}</span>
      ) : null}
    </div>
  );
}
