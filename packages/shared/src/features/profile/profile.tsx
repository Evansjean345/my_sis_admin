"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useOptionalAccess } from "@shared/components/providers/access-provider";
import { ErrorState, LoadingRows } from "@shared/components/query-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@shared/components/ui/breadcrumb";
import { Separator } from "@shared/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { ProfileHeader } from "@shared/features/profile/profile-header";
import { ProfileOverview } from "@shared/features/profile/profile-overview";
import { ProfilePermissions } from "@shared/features/profile/profile-permissions";
import { ProfileSecurity } from "@shared/features/profile/profile-security";
import { ProfileStatusSidebar } from "@shared/features/profile/profile-status-sidebar";
import { useCurrentUser } from "@shared/hooks/api/use-auth";
import { useRoles } from "@shared/hooks/api/use-roles";
import { useUser } from "@shared/hooks/api/use-users";
import { useHydrated } from "@shared/hooks/use-hydrated";

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
  // `/roles` et la fiche détaillée exigent `user:write` : l'opérateur (niveau 3)
  // lit son rôle et ses habilitations directement dans /auth/me.
  const canManageUsers = useOptionalAccess()?.can("user:write") ?? false;
  const roles = useRoles(canManageUsers);
  const detail = useUser(me.data?.id, { enabled: canManageUsers });

  if (!hydrated || me.isPending) return <LoadingRows rows={6} className="flex flex-col gap-2 px-4" />;
  if (me.isError) {
    return (
      <div className="px-4">
        <ErrorState error={me.error} onRetry={() => me.refetch()} />
      </div>
    );
  }

  const user = me.data;
  const fromMe = user.role ? { ...user.role, permissions: user.permissions ?? [] } : undefined;
  const role = detail.data?.role ?? roles.data?.find((r) => r.id === user.roleId) ?? fromMe;

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
            <ProfilePermissions role={role} loading={canManageUsers && roles.isPending && detail.isPending} />
          </TabsContent>

          <TabsContent className="py-4" value="security">
            <ProfileSecurity />
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
