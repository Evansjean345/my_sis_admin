"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Pencil, RefreshCw } from "lucide-react";

import { DetailList } from "@/components/detail-list";
import { ErrorState, LoadingRows } from "@/components/query-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroup } from "@/hooks/api/use-groups";
import { formatDateTime } from "@/lib/format";

import { AuditLogPanel } from "../audit/audit-log-panel";
import { GroupColorDot } from "./group-color-field";
import type { GroupFamily } from "./group-family";
import { GroupFormDialog } from "./group-form-dialog";
import { GroupMembersCard } from "./group-members-card";
import { GroupRowActions } from "./group-row-actions";
import { GroupSchedulesCard } from "./group-schedules-card";
import { GroupSecurityActions } from "./group-security-actions";

/**
 * Détail d'un groupe : composition et journal.
 *
 * Le journal du groupe réunit trois ensembles — le groupe, ses membres et
 * les commandes émises sur ces membres. C'est la seule vue où une
 * immobilisation apparaît à côté du véhicule qu'elle a visé.
 */
export function GroupDetailScreen({ family, id }: { family: GroupFamily; id: string }) {
  const router = useRouter();
  const group = useGroup(family.kind, id);
  const [editOpen, setEditOpen] = useState(false);

  if (group.isPending) return <LoadingRows rows={8} />;
  if (group.isError) {
    return <ErrorState error={group.error} onRetry={() => group.refetch()} title="Groupe introuvable" />;
  }

  const data = group.data;
  /** Horaires et commandes de sécurité n'ont de sens que pour une flotte de véhicules. */
  const isFleet = family.kind === "vehicle_group";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={family.route} prefetch={false}>
            <ArrowLeft data-icon="inline-start" />
            {family.title}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="flex items-center gap-2 font-medium text-2xl leading-none tracking-tight sm:text-3xl">
            <GroupColorDot color={data.color} className="size-3" />
            {data.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span>{data.description ?? "Sans description"}</span>
            <StatusBadge tone="info" dot={false}>
              {data.membersCount} {data.membersCount > 1 ? family.memberPlural : family.memberSingular}
            </StatusBadge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => group.refetch()} disabled={group.isFetching}>
            <RefreshCw className={group.isFetching ? "animate-spin" : undefined} />
            <span className="sr-only">Actualiser</span>
          </Button>
          {isFleet ? (
            <GroupSecurityActions groupId={data.id} groupName={data.name} membersCount={data.membersCount} />
          ) : null}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            Modifier
          </Button>
          <GroupRowActions
            family={family}
            group={data}
            showView={false}
            onDeleted={() => router.replace(family.route)}
          />
        </div>
      </div>

      <Tabs defaultValue="members">
        {/* Piste neutre : le jeton --muted du thème clair (#286ea8) ne laisse qu'un contraste
            d'environ 2:1 au libellé des onglets inactifs (4,5:1 requis) ; libellé remonté à 80 %. */}
        <TabsList className="bg-muted-foreground/10 *:data-[slot=tabs-trigger]:text-foreground/80">
          <TabsTrigger value="members">Composition</TabsTrigger>
          {isFleet ? <TabsTrigger value="schedules">Horaires</TabsTrigger> : null}
          <TabsTrigger value="audit">Journal</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="flex flex-col gap-4 pt-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informations</CardTitle>
              <CardDescription>Identité du groupe et dates de suivi.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Nom", value: data.name },
                  { label: "Description", value: data.description ?? "—" },
                  { label: "Couleur", value: data.color ?? "—", mono: Boolean(data.color) },
                  { label: "Effectif", value: `${data.membersCount}` },
                  { label: "Identifiant", value: data.id, mono: true },
                  { label: "Organisation", value: data.organizationId, mono: true },
                  { label: "Créé le", value: formatDateTime(data.createdAt) },
                  { label: "Modifié le", value: formatDateTime(data.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>

          <GroupMembersCard
            family={family}
            groupId={data.id}
            groupName={data.name}
            organizationId={data.organizationId}
            members={data.members}
          />
        </TabsContent>

        {isFleet ? (
          <TabsContent value="schedules" className="pt-4">
            <GroupSchedulesCard groupId={data.id} groupName={data.name} organizationId={data.organizationId} />
          </TabsContent>
        ) : null}

        <TabsContent value="audit" className="pt-4">
          <AuditLogPanel
            source={{ scope: "group", kind: family.kind, groupId: data.id }}
            title="Journal du groupe"
            description={`Actes sur le groupe, sur ses ${family.memberPlural}, et commandes émises sur ces ${family.memberPlural}.`}
            compact
          />
        </TabsContent>
      </Tabs>

      <GroupFormDialog family={family} group={data} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
