"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Globe, Pencil, RefreshCw } from "lucide-react";

import { DetailList } from "@/components/detail-list";
import { ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationLabel } from "@/hooks/api/use-organizations";
import { useSchedule } from "@/hooks/api/use-schedules";
import { formatDateTime } from "@/lib/format";

import { AuditLogPanel } from "../../../_components/audit/audit-log-panel";
import { weeklyHours } from "../../../_components/schedules/week-utils";
import { ScheduleFormDialog } from "../../_components/schedule-form-dialog";
import { ScheduleRowActions } from "../../_components/schedule-row-actions";
import { SchedulePreviewCard } from "./schedule-preview-card";
import { ScheduleTargetsCard } from "./schedule-targets-card";
import { ScheduleWindowsCard } from "./schedule-windows-card";

/**
 * Détail d'un calendrier : semaine type, véhicules et flottes rattachés,
 * simulation du moteur. C'est ici que se décide l'immobilisation planifiée
 * d'un véhicule ou d'une flotte entière.
 */
export function ScheduleDetail({ id }: { id: string }) {
  const router = useRouter();
  const schedule = useSchedule(id);
  const organization = useOrganizationLabel(schedule.data?.organizationId, schedule.data?.organization);
  const [editOpen, setEditOpen] = useState(false);

  if (schedule.isPending) return <LoadingRows rows={8} />;
  if (schedule.isError) {
    return <ErrorState error={schedule.error} onRetry={() => schedule.refetch()} title="Calendrier introuvable" />;
  }

  const s = schedule.data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/clock" prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            Gestion des horaires
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-medium text-2xl leading-none tracking-tight sm:text-3xl">{s.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{s.description ?? "Sans description"}</span>
            <StatusBadge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Actif" : "Inactif"}</StatusBadge>
            <StatusBadge tone="info" dot={false}>
              <Globe className="size-3" />
              {s.timezone}
            </StatusBadge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => schedule.refetch()} disabled={schedule.isFetching}>
            <RefreshCw className={schedule.isFetching ? "animate-spin" : undefined} />
            <span className="sr-only">Actualiser</span>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Modifier
          </Button>
          <ScheduleRowActions schedule={s} showView={false} onDeleted={() => router.replace("/dashboard/clock")} />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            {s.isActive
              ? "Appliqué par le moteur planifié à chaque passage (une fois par minute)."
              : "Inactif : le moteur l'ignore. Activez-le une fois les plages et les rattachements vérifiés."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Organisation", value: organization?.name ?? s.organizationId, mono: !organization },
              { label: "Plages", value: `${s.windows.length} · ${weeklyHours(s.windows)} h / semaine` },
              { label: "Véhicules", value: s.vehicles.length },
              { label: "Flottes", value: s.vehicleGroups.length },
              { label: "Créé le", value: formatDateTime(s.createdAt) },
              { label: "Modifié le", value: formatDateTime(s.updatedAt) },
            ]}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="windows">
        {/* Piste neutre : le jeton --muted du thème clair (#286ea8) ne laisse qu'un contraste
            d'environ 2:1 au libellé des onglets inactifs (4,5:1 requis) ; libellé remonté à 80 %. */}
        <TabsList className="bg-muted-foreground/10 *:data-[slot=tabs-trigger]:text-foreground/80">
          <TabsTrigger value="windows">Plages</TabsTrigger>
          <TabsTrigger value="vehicles">Véhicules ({s.vehicles.length})</TabsTrigger>
          <TabsTrigger value="groups">Flottes ({s.vehicleGroups.length})</TabsTrigger>
          <TabsTrigger value="preview">Simulation</TabsTrigger>
          <TabsTrigger value="audit">Journal</TabsTrigger>
        </TabsList>
        <TabsContent value="windows" className="pt-4">
          <ScheduleWindowsCard scheduleId={s.id} windows={s.windows} />
        </TabsContent>
        <TabsContent value="vehicles" className="pt-4">
          <ScheduleTargetsCard
            kind="vehicles"
            scheduleId={s.id}
            organizationId={s.organizationId}
            targets={s.vehicles}
          />
        </TabsContent>
        <TabsContent value="groups" className="pt-4">
          <ScheduleTargetsCard
            kind="groups"
            scheduleId={s.id}
            organizationId={s.organizationId}
            targets={s.vehicleGroups}
          />
        </TabsContent>
        <TabsContent value="preview" className="pt-4">
          <SchedulePreviewCard scheduleId={s.id} />
        </TabsContent>
        <TabsContent value="audit" className="pt-4">
          <AuditLogPanel
            source={{ scope: "organization", organizationId: s.organizationId }}
            title="Journal de l'organisation"
            description="Filtrez sur la ressource « calendrier » pour suivre ce calendrier, ou sur « véhicule » pour les transitions du moteur."
          />
        </TabsContent>
      </Tabs>

      <ScheduleFormDialog schedule={s} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
