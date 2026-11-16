"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import type { GroupFamily } from "@shared/features/common/groups/group-family";
import { GroupFormDialog } from "@shared/features/common/groups/group-form-dialog";
import { useDeleteGroup } from "@shared/hooks/api/use-groups";
import { getErrorMessage } from "@shared/lib/axios";
import type { Group } from "@shared/types/group";

export function GroupRowActions({
  family,
  group,
  showView = true,
  onDeleted,
}: {
  family: GroupFamily;
  group: Group;
  showView?: boolean;
  onDeleted?: () => void;
}) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const remove = useDeleteGroup(family.kind);
  const canWrite = useOptionalAccess()?.can(family.writePermission) ?? false;

  // Consultation seule (opérateur) : un lien direct plutôt qu'un menu vide.
  if (!canWrite) {
    return showView ? (
      <Button asChild size="icon-sm" variant="ghost" aria-label={`Voir ${group.name}`}>
        <Link href={`${family.route}/${group.id}`} prefetch={false}>
          <Eye className="size-4" />
        </Link>
      </Button>
    ) : null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions pour ${group.name}`}
            className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {showView ? (
            <DropdownMenuItem asChild>
              <Link href={`${family.route}/${group.id}`} prefetch={false}>
                <Eye />
                Voir le détail
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GroupFormDialog
        family={family}
        group={group}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Supprimer ${group.name} ?`}
        description={`Suppression logique : le groupe sort des listes mais reste référencé par les politiques, les géofences et le journal d'audit. Les ${family.memberPlural} ne sont pas supprimés.`}
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(group.id, {
            onSuccess: () => {
              toast.success("Groupe supprimé", { description: group.name });
              setDialog(null);
              onDeleted?.();
            },
            onError: (error) => toast.error("Suppression impossible", { description: getErrorMessage(error) }),
          })
        }
      />
    </>
  );
}
