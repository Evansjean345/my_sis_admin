import { DetailList } from "@shared/components/detail-list";
import { Separator } from "@shared/components/ui/separator";
import type { CurrentUser } from "@shared/types/auth";
import type { UserDetail } from "@shared/types/user";

interface ProfileOverviewProps {
  user: CurrentUser;
  detail?: UserDetail;
  roleName?: string;
}

export function ProfileOverview({ user, detail, roleName }: ProfileOverviewProps) {
  return (
    <div className="flex flex-col">
      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-medium text-base">Informations du compte</h2>
        <DetailList
          items={[
            { label: "Nom complet", value: user.fullName },
            { label: "Adresse e-mail", value: user.email },
            { label: "Téléphone", value: detail?.phone ?? "—" },
            { label: "Rôle", value: roleName ?? "—" },
            { label: "Langue", value: detail?.locale === "en" ? "English" : detail ? "Français" : "—" },
            { label: "Fuseau horaire", value: detail?.timezone ?? "—" },
          ]}
        />
      </section>

      <Separator className="my-4" />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-medium text-base">Identifiants techniques</h2>
        <DetailList
          items={[
            { label: "ID utilisateur", value: user.id, mono: true },
            { label: "ID organisation", value: user.organizationId, mono: true },
            { label: "ID rôle", value: user.roleId, mono: true },
          ]}
        />
      </section>
    </div>
  );
}
