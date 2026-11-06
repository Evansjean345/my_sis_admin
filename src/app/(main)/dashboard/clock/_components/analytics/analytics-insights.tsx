import Link from "next/link";

import type { LucideIcon } from "lucide-react";
import { CircleCheck, Info, Layers, PowerOff, SquareParking, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AnalyticsModel } from "./model";

interface Insight {
  key: string;
  tone: "critical" | "warning" | "info";
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
}

const toneClass: Record<Insight["tone"], string> = {
  critical: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-muted-foreground",
};

const toneLabel: Record<Insight["tone"], string> = {
  critical: "Critique",
  warning: "À vérifier",
  info: "Information",
};

/**
 * Ce qui mérite une action : configurations qui immobilisent sans fin,
 * calendriers ou flottes sans effet, véhicules soumis à plusieurs règles.
 * Chaque point porte un libellé de gravité en plus de sa couleur.
 */
export function AnalyticsInsights({
  model,
  alwaysRestricted,
  inactiveTotal,
  truncated,
}: {
  model: AnalyticsModel;
  alwaysRestricted: number;
  inactiveTotal: number;
  truncated: boolean;
}) {
  const insights: Insight[] = [];

  const permanent = model.stats.filter((s) => s.permanent);
  const links = (list: typeof permanent) =>
    list.map((s, i) => (
      <span key={s.schedule.id}>
        {i > 0 ? ", " : ""}
        <Link href={`/dashboard/clock/${s.schedule.id}`} prefetch={false} className="underline">
          {s.schedule.name}
        </Link>
      </span>
    ));
  if (alwaysRestricted > 0) {
    insights.push({
      key: "always",
      tone: "critical",
      icon: PowerOff,
      title: `${alwaysRestricted} véhicule(s) immobilisé(s) en permanence`,
      body: (
        <>
          Aucune plage ne les libère sur toute la période affichée.
          {permanent.length > 0 ? <> En cause probable : calendrier autorisé sans plage — {links(permanent)}.</> : null}
        </>
      ),
    });
  }

  if (alwaysRestricted === 0 && permanent.length > 0) {
    insights.push({
      key: "noWindow",
      tone: "warning",
      icon: PowerOff,
      title: `${permanent.length} calendrier(s) autorisé(s) sans aucune plage`,
      body: (
        <>
          Seul, un tel calendrier immobilise ses véhicules en permanence ; ici un autre calendrier autorisé les libère
          encore. À compléter ou à suspendre : {links(permanent)}.
        </>
      ),
    });
  }

  if (model.multiScheduleVehicles.length > 0) {
    const sample = model.multiScheduleVehicles.slice(0, 4);
    insights.push({
      key: "multi",
      tone: "warning",
      icon: Layers,
      title: `${model.multiScheduleVehicles.length} véhicule(s) soumis à plusieurs calendriers`,
      body: (
        <>
          Le plus restrictif s'applique (une interdiction l'emporte toujours).{" "}
          {sample.map((v, i) => (
            <span key={v.id}>
              {i > 0 ? ", " : ""}
              <Link href={`/dashboard/vehicles/${v.id}`} prefetch={false} className="font-mono underline">
                {v.label}
              </Link>
            </span>
          ))}
          {model.multiScheduleVehicles.length > sample.length
            ? ` et ${model.multiScheduleVehicles.length - sample.length} autre(s)`
            : ""}
          .
        </>
      ),
    });
  }

  const withoutEffect = model.stats.filter((s) => s.withoutEffect);
  if (withoutEffect.length > 0) {
    insights.push({
      key: "noeffect",
      tone: "warning",
      icon: TriangleAlert,
      title: `${withoutEffect.length} calendrier(s) actif(s) sans effet`,
      body: (
        <>
          Aucun véhicule rattaché, directement ou par une flotte :{" "}
          {withoutEffect.slice(0, 4).map((s, i) => (
            <span key={s.schedule.id}>
              {i > 0 ? ", " : ""}
              <Link href={`/dashboard/clock/${s.schedule.id}`} prefetch={false} className="underline">
                {s.schedule.name}
              </Link>
            </span>
          ))}
          .
        </>
      ),
    });
  }

  if (model.emptyGroups.length > 0) {
    insights.push({
      key: "emptygroups",
      tone: "warning",
      icon: SquareParking,
      title: `${model.emptyGroups.length} flotte(s) rattachée(s) mais vide(s)`,
      body: (
        <>
          {model.emptyGroups.slice(0, 4).map((g, i) => (
            <span key={`${g.id}-${g.schedule}`}>
              {i > 0 ? ", " : ""}
              <Link href={`/dashboard/group_vehicle/${g.id}`} prefetch={false} className="underline">
                {g.name}
              </Link>{" "}
              ({g.schedule})
            </span>
          ))}
          . Ajoutez-y des véhicules ou retirez le rattachement.
        </>
      ),
    });
  }

  if (model.mixedTimezones) {
    insights.push({
      key: "tz",
      tone: "info",
      icon: Info,
      title: "Plusieurs fuseaux horaires",
      body: `Les plages sont converties et affichées dans le fuseau ${model.displayTz}.`,
    });
  }
  if (inactiveTotal > 0) {
    insights.push({
      key: "inactive",
      tone: "info",
      icon: Info,
      title: `${inactiveTotal} calendrier(s) suspendu(s) non pris en compte`,
      body: "Un calendrier inactif est ignoré par le moteur : il n'apparaît pas dans ces analyses.",
    });
  }
  if (truncated) {
    insights.push({
      key: "truncated",
      tone: "warning",
      icon: TriangleAlert,
      title: "Analyse limitée aux 100 premiers calendriers actifs",
      body: "Filtrez par organisation pour une analyse complète.",
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Points d'attention</CardTitle>
        <CardDescription>Configurations à vérifier avant qu'elles ne pèsent sur l'exploitation.</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="flex items-center gap-2 text-muted-foreground text-sm">
            <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Aucun point d'attention : chaque calendrier actif s'applique à des véhicules, sans immobilisation
            permanente.
          </p>
        ) : (
          <ul className="grid gap-x-8 gap-y-3 lg:grid-cols-2">
            {insights.map((it) => (
              <li key={it.key} className="flex gap-3">
                <it.icon className={`mt-0.5 size-4 shrink-0 ${toneClass[it.tone]}`} aria-hidden="true" />
                <div className="flex min-w-0 flex-col gap-0.5 text-sm">
                  <span className="font-medium">
                    <span className={`mr-1.5 text-xs uppercase tracking-wide ${toneClass[it.tone]}`}>
                      {toneLabel[it.tone]}
                    </span>
                    {it.title}
                  </span>
                  <span className="text-muted-foreground">{it.body}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
