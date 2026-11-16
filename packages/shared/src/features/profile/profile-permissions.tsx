import { ShieldCheck } from "lucide-react";

import { EmptyState, LoadingRows } from "@shared/components/query-state";
import { permissionLabel } from "@shared/components/status-labels";
import { Badge } from "@shared/components/ui/badge";
import type { Role, UserRole } from "@shared/types/role";

export function ProfilePermissions({ role, loading }: { role?: Role | UserRole; loading: boolean }) {
  if (loading) return <LoadingRows rows={3} className="flex flex-col gap-2" />;
  if (!role) {
    return <EmptyState icon={<ShieldCheck />} title="Rôle indisponible" description="Impossible de lire votre rôle." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading font-medium text-base">{role.name}</h2>
        {"description" in role && role.description ? (
          <p className="text-muted-foreground text-sm">{role.description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {role.permissions.map((permission) => (
          <Badge key={permission} variant="outline" className="rounded-sm" title={permission}>
            {permissionLabel(permission)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
