"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { Plus, UserMinus, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState, ErrorState, LoadingRows } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttachDriverGroups, useDetachDriverGroup } from "@/hooks/api/use-drivers";
import { useDriverGroups } from "@/hooks/api/use-groups";
import { getErrorMessage } from "@/lib/axios";
import { formatDate } from "@/lib/format";
import type { DriverDetail, DriverGroupSummary } from "@/types/driver";

import { GroupColorDot } from "../../../_components/groups/group-color-field";

/**
 * ÉQUIPES du conducteur, depuis sa fiche : ajout à une ou plusieurs équipes de
 * SON organisation, retrait. Un conducteur sans organisation n'entre dans
 * aucune équipe (les équipes appartiennent à un client).
 */
export function DriverGroupsCard({ driver }: { driver: DriverDetail }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [removing, setRemoving] = useState<DriverGroupSummary | null>(null);
  const attach = useAttachDriverGroups();
  const detach = useDetachDriverGroup();
  const organizationId = driver.organizationId;

  const candidates = useDriverGroups(
    { page: 1, perPage: 100, organizationId: organizationId ?? undefined },
    { enabled: pickerOpen && Boolean(organizationId) },
  );
  const membres = useMemo(() => new Set(driver.groups.map((g) => g.id)), [driver.groups]);

  useEffect(() => {
    if (pickerOpen) setSelected([]);
  }, [pickerOpen]);

  function submit() {
    attach.mutate(
      { id: driver.id, groupIds: selected },
      {
        onSuccess: (r) => {
          const parts = [`${r.applied.length} ajout(s)`];
          if (r.unchanged.length) parts.push(`${r.unchanged.length} déjà membre`);
          if (r.rejected.length) parts.push(`${r.rejected.length} refusé(s)`);
          toast.success("Équipes mises à jour", { description: parts.join(" · ") });
          setPickerOpen(false);
        },
        onError: (error) => toast.error("Ajout impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Équipes</CardTitle>
        <CardDescription>
          {organizationId
            ? `${driver.groups.length} équipe(s) de son organisation.`
            : "Rattachez d'abord le conducteur à une organisation."}
        </CardDescription>
        <CardAction>
          <Button size="sm" disabled={!organizationId} onClick={() => setPickerOpen(true)}>
            <Plus data-icon="inline-start" />
            Ajouter à des équipes
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {driver.groups.length === 0 ? (
          <div className="px-4">
            <EmptyState
              icon={<UsersRound />}
              title="Aucune équipe"
              description="Ce conducteur n'appartient à aucune équipe."
            />
          </div>
        ) : (
          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader>
              <TableRow>
                <TableHead>Équipe</TableHead>
                <TableHead className="hidden sm:table-cell">Membre depuis</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driver.groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/group_driver/${g.id}`}
                      prefetch={false}
                      className="flex items-center gap-2 font-medium hover:underline"
                    >
                      <GroupColorDot color={g.color} />
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(g.addedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Retirer de l'équipe ${g.name}`}
                        onClick={() => setRemoving(g)}
                      >
                        <UserMinus />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={pickerOpen} onOpenChange={(o) => !attach.isPending && setPickerOpen(o)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter à des équipes</DialogTitle>
            <DialogDescription>Équipes de {driver.organization?.name ?? "son organisation"}.</DialogDescription>
          </DialogHeader>
          {candidates.isPending ? (
            <LoadingRows rows={3} className="flex flex-col gap-2" />
          ) : candidates.isError ? (
            <ErrorState error={candidates.error} onRetry={() => candidates.refetch()} />
          ) : (candidates.data?.data ?? []).length === 0 ? (
            <EmptyState
              icon={<UsersRound />}
              title="Aucune équipe"
              description="Créez d'abord une équipe dans « Équipes de conducteurs »."
            />
          ) : (
            <ScrollArea className="h-64 rounded-md border">
              <ul className="divide-y">
                {(candidates.data?.data ?? []).map((g) => {
                  const membre = membres.has(g.id);
                  return (
                    <li key={g.id}>
                      <label
                        htmlFor={`driver-group-${g.id}`}
                        className={
                          membre
                            ? "flex cursor-not-allowed items-center gap-3 px-3 py-2.5 opacity-60"
                            : "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
                        }
                      >
                        <Checkbox
                          id={`driver-group-${g.id}`}
                          checked={membre || selected.includes(g.id)}
                          disabled={membre}
                          onCheckedChange={() =>
                            setSelected((cur) => (cur.includes(g.id) ? cur.filter((x) => x !== g.id) : [...cur, g.id]))
                          }
                        />
                        <GroupColorDot color={g.color} />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-sm">{g.name}</span>
                          <span className="truncate text-muted-foreground text-xs">{g.membersCount} conducteur(s)</span>
                        </span>
                        {membre ? <span className="ml-auto text-muted-foreground text-xs">déjà membre</span> : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={attach.isPending} onClick={() => setPickerOpen(false)}>
              Annuler
            </Button>
            <Button disabled={selected.length === 0 || attach.isPending} onClick={submit}>
              {attach.isPending ? <Spinner data-icon="inline-start" /> : null}
              Ajouter ({selected.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Retirer de l'équipe ${removing?.name ?? ""} ?`}
        description="Le conducteur quitte l'équipe mais n'est ni supprimé ni modifié."
        confirmLabel="Retirer"
        loading={detach.isPending}
        onConfirm={() =>
          removing &&
          detach.mutate(
            { id: driver.id, groupId: removing.id },
            {
              onSuccess: () => {
                toast.success("Retiré de l'équipe", { description: removing.name });
                setRemoving(null);
              },
              onError: (error) => toast.error("Retrait impossible", { description: getErrorMessage(error) }),
            },
          )
        }
      />
    </Card>
  );
}
