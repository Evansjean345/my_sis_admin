"use client";

import { useState } from "react";

import Link from "next/link";

import { Ban, Eye, MoreHorizontal, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@shared/components/confirm-dialog";
import { Button } from "@shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { UserEditDialog } from "@shared/features/users/user-edit-dialog";
import { useCurrentUser } from "@shared/hooks/api/use-auth";
import { useActivateUser, useDeleteUser, useSuspendUser } from "@shared/hooks/api/use-users";
import { getErrorMessage } from "@shared/lib/axios";
import type { User } from "@shared/types/user";

export function UserRowActions({ user, onDeleted }: { user: User; onDeleted?: () => void }) {
  const [dialog, setDialog] = useState<"edit" | "suspend" | "delete" | null>(null);
  const { data: me } = useCurrentUser();
  const suspend = useSuspendUser();
  const activate = useActivateUser();
  const remove = useDeleteUser();
  const isSelf = me?.id === user.id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions pour ${user.fullName}`}
            className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/users/${user.id}`} prefetch={false}>
              <Eye />
              Voir le détail
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {user.status === "suspended" ? (
            <DropdownMenuItem
              disabled={activate.isPending}
              onClick={() =>
                activate.mutate(user.id, {
                  onSuccess: () => toast.success("Accès réactivé", { description: user.email }),
                  onError: (error) => toast.error("Réactivation impossible", { description: getErrorMessage(error) }),
                })
              }
            >
              <ShieldCheck />
              Réactiver l'accès
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={isSelf} onClick={() => setDialog("suspend")}>
              <Ban />
              Suspendre l'accès
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" disabled={isSelf} onClick={() => setDialog("delete")}>
            <Trash2 />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserEditDialog user={user} open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)} />

      <ConfirmDialog
        open={dialog === "suspend"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Suspendre ${user.fullName} ?`}
        description="L'utilisateur ne pourra plus se connecter et toutes ses sessions seront révoquées."
        confirmLabel="Suspendre"
        destructive
        loading={suspend.isPending}
        onConfirm={() =>
          suspend.mutate(user.id, {
            onSuccess: () => {
              toast.success("Accès suspendu", { description: user.email });
              setDialog(null);
            },
            onError: (error) => toast.error("Suspension impossible", { description: getErrorMessage(error) }),
          })
        }
      />

      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={`Supprimer ${user.fullName} ?`}
        description="Suppression logique : le compte est désactivé et n'apparaîtra plus dans la liste."
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(user.id, {
            onSuccess: () => {
              toast.success("Utilisateur supprimé", { description: user.email });
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
