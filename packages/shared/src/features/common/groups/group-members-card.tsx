"use client";

import { useState } from "react";

import Link from "next/link";

import { Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { EmptyState } from "@shared/components/query-state";
import { Button } from "@shared/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import type { GroupFamily } from "@shared/features/common/groups/group-family";
import { GroupMembersPicker } from "@shared/features/common/groups/group-members-picker";
import { useUnassignGroupMember } from "@shared/hooks/api/use-groups";
import { getErrorMessage } from "@shared/lib/axios";
import { downloadCsv, formatDateTime } from "@shared/lib/format";
import type { GroupMember } from "@shared/types/group";

/** Membres du groupe : ajout en lot, retrait à l'unité, export de la composition. */
export function GroupMembersCard({
  family,
  groupId,
  groupName,
  organizationId,
  members,
}: {
  family: GroupFamily;
  groupId: string;
  /** Organisation du groupe — borne le choix des nouveaux membres. */
  organizationId: string;
  groupName: string;
  members: GroupMember[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<GroupMember | null>(null);
  const unassign = useUnassignGroupMember(family.kind);
  const canWrite = useOptionalAccess()?.can(family.writePermission) ?? false;

  function exportCsv() {
    downloadCsv(
      `${family.kind}-${groupName.toLowerCase().replaceAll(/\s+/g, "-")}.csv`,
      members.map((member) => ({
        identifiant: member.id,
        etiquette: member.label,
        ajoute_le: formatDateTime(member.addedAt),
      })),
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle>Membres</CardTitle>
        <CardDescription>
          {members.length} {members.length > 1 ? family.memberPlural : family.memberSingular} dans ce groupe.
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={members.length === 0}>
            <Download data-icon="inline-start" />
            Exporter
          </Button>
          {canWrite ? (
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <Plus data-icon="inline-start" />
              Ajouter
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {members.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<family.memberIcon />}
              title={`Aucun ${family.memberSingular}`}
              description={`Ce groupe est vide : ajoutez-y des ${family.memberPlural}.`}
              action={
                canWrite ? (
                  <Button size="sm" onClick={() => setPickerOpen(true)}>
                    <Plus data-icon="inline-start" />
                    Ajouter des {family.memberPlural}
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
              <TableHeader>
                <TableRow>
                  <TableHead>{family.memberColumnLabel}</TableHead>
                  <TableHead className="hidden md:table-cell">Ajouté le</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link
                        href={`${family.memberRoute}/${member.id}`}
                        prefetch={false}
                        className="font-medium hover:underline"
                      >
                        {member.label}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDateTime(member.addedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          hidden={!canWrite}
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Retirer ${member.label} du groupe`}
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setPendingRemoval(member)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <GroupMembersPicker
        family={family}
        groupId={groupId}
        organizationId={organizationId}
        currentMemberIds={members.map((member) => member.id)}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={pendingRemoval ? `Retirer ${pendingRemoval.label} ?` : ""}
        description={`Le ${family.memberSingular} quitte le groupe mais n'est ni supprimé ni modifié.`}
        confirmLabel="Retirer"
        destructive
        loading={unassign.isPending}
        onConfirm={() => {
          if (!pendingRemoval) return;
          unassign.mutate(
            { id: groupId, memberId: pendingRemoval.id },
            {
              onSuccess: () => {
                toast.success("Membre retiré", { description: pendingRemoval.label });
                setPendingRemoval(null);
              },
              onError: (error) => toast.error("Retrait impossible", { description: getErrorMessage(error) }),
            },
          );
        }}
      />
    </Card>
  );
}
