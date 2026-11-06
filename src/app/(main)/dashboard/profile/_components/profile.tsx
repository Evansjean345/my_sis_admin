"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ErrorState, LoadingRows } from "@/components/query-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/hooks/api/use-auth";
import { useRoles } from "@/hooks/api/use-roles";
import { useUser } from "@/hooks/api/use-users";
import { useHydrated } from "@/hooks/use-hydrated";

import { ProfileHeader } from "./profile-header";
import { ProfileOverview } from "./profile-overview";
import { ProfilePermissions } from "./profile-permissions";
import { ProfileSecurity } from "./profile-security";
import { ProfileStatusSidebar } from "./profile-status-sidebar";

const TABS = ["overview", "permissions", "security"] as const;
type ProfileTab = (typeof TABS)[number];

export function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: ProfileTab = TABS.includes(requested as ProfileTab) ? (requested as ProfileTab) : "overview";

  // Le serveur rend toujours l'état de chargement (session inconnue) : le premier
  // rendu client doit faire de même, même si l'utilisateur est déjà en cache.
  const hydrated = useHydrated();
  const me = useCurrentUser();
  const roles = useRoles();
  // Fiche détaillée : exige la permission user:read — l'écran reste utilisable sans.
  const detail = useUser(me.data?.id);

  if (!hydrated || me.isPending) return <LoadingRows rows={6} className="flex flex-col gap-2 px-4" />;
  if (me.isError) {
    return (
      <div className="px-4">
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </div>
    );
  }

  const user = me.data;
  const role = detail.data?.role ?? roles.data?.find((r) => r.id === user.roleId);

  return (
    <>
      <Breadcrumb className="px-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <span>Dashboard</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span>Compte</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mon profil</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ProfileHeader user={user} detail={detail.data} roleName={role?.name} />

      <Tabs
        className="min-h-0 flex-1 gap-0"
        value={tab}
        onValueChange={(value) => router.replace(`${pathname}?tab=${value}`, { scroll: false })}
      >
        <div className="scrollbar-none touch-pan-x overflow-x-auto overscroll-x-contain border-y">
          <TabsList
            className="w-max min-w-full justify-start gap-4 px-4 *:data-[slot=tabs-trigger]:flex-none"
            variant="line"
          >
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
          </TabsList>
        </div>

        <div className="px-4 md:px-6">
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
              <div className="py-4 lg:pr-6">
                <ProfileOverview user={user} detail={detail.data} roleName={role?.name} />
              </div>
              <Separator className="hidden lg:block" orientation="vertical" />
              <div className="py-4 lg:pl-6">
                <ProfileStatusSidebar detail={detail.data} />
              </div>
            </div>
          </TabsContent>

          <TabsContent className="py-4" value="permissions">
            <ProfilePermissions role={role} loading={roles.isPending && detail.isPending} />
          </TabsContent>

          <TabsContent className="py-4" value="security">
            <ProfileSecurity />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
