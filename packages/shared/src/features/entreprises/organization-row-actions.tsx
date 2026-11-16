"use client";

import { useState } from "react";

import Link from "next/link";

import { Eye, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
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
import { OrganizationFormDialog } from "@shared/features/entreprises/organization-form-dialog";
import { useCurrentUser } from "@shared/hooks/api/use-auth";
import { useUpdateOrganization } from "@shared/hooks/api/use-organizations";
import { getErrorMessage } from "@shared/lib/axios";
import type { Organization } from "@shared/types/organization";

/**
 * Actions sur une organisation.
 *
 * Il n'y a pas de suppression : l'API n'expose que l'activation et la
 * désactivation. Une organisation qui a produit de l'audit ne s'efface pas.
 */
export function OrganizationRowActions({
  organization,
  showView = true,
}: {
  organization: Organization;
  showView?: boolean;
}) {
  const [dialog, setDialog] = useState<"edit" | "toggle" | null>(null);
  const update = useUpdateOrganization();
  const { data: me } = useCurrentUser();

  // Garde-fou repris de l'API : l'exploitant ne peut pas désactiver la sienne.
  const isOwn = me?.organizationId === organization.id;
  const nextActive = !organization.isActive;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Actions pour ${organization.name}`}
            className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
            size="icon-sm"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {showView ? (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/entreprises/${organization.id}`} prefetch={false}>
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
          <DropdownMenuItem
            variant={organization.isActive ? "destructive" : "default"}
            disabled={isOwn && organization.isActive}
            onClick={() => setDialog("toggle")}
          >
            {organization.isActive ? <PowerOff /> : <Power />}
            {organization.isActive ? "Désactiver" : "Réactiver"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OrganizationFormDialog
        organization={organization}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === "toggle"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={organization.isActive ? `Désactiver ${organization.name} ?` : `Réactiver ${organization.name} ?`}
        description={
          organization.isActive
            ? "Les comptes de cette organisation ne pourront plus se connecter. Les données et le journal d'audit sont conservés."
            : "Les comptes de cette organisation pourront de nouveau se connecter."
        }
        confirmLabel={organization.isActive ? "Désactiver" : "Réactiver"}
        destructive={organization.isActive}
        loading={update.isPending}
        onConfirm={() =>
          update.mutate(
            { id: organization.id, payload: { isActive: nextActive } },
            {
              onSuccess: () => {
                toast.success(nextActive ? "Organisation réactivée" : "Organisation désactivée", {
                  description: organization.name,
                });
                setDialog(null);
              },
              onError: (error) => toast.error("Opération impossible", { description: getErrorMessage(error) }),
            },
          )
        }
      />
    </>
  );
}
