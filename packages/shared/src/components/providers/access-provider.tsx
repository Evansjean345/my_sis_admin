"use client";

import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef } from "react";

import { useRouter } from "next/navigation";

import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, LogOut, ShieldAlert } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shared/components/ui/empty";
import { Spinner } from "@shared/components/ui/spinner";
import { levelOfUser, useCurrentUser, useLogout } from "@shared/hooks/api/use-auth";
import {
  type AccessLevel,
  covers,
  LEVEL_DEFAULT_PERMISSIONS,
  LEVEL_META,
  type LevelMeta,
  loginUrlOf,
} from "@shared/lib/access/levels";
import { getAccessLevel, saveAccessLevel } from "@shared/lib/auth-token";
import { getErrorMessage } from "@shared/lib/axios";
import type { CurrentUser } from "@shared/types/auth";

export interface AccessValue {
  level: AccessLevel;
  meta: LevelMeta;
  /** `undefined` tant que `/auth/me` n'a pas répondu. */
  user: CurrentUser | undefined;
  permissions: readonly string[];
  /** Habilitation `ressource:action` — même règle de couverture que l'API. */
  can: (permission: string) => boolean;
  /** Niveau 1 : exploitant de la plateforme, routes `/admin/*`. */
  isPlatform: boolean;
  /** Niveau 2 : administrateur de son organisation. */
  isOrganizationAdmin: boolean;
  /** Niveau 3 : opérateur, client final (consultation et coupure moteur). */
  isOperator: boolean;
  organizationId: string | undefined;
  organizationName: string | undefined;
}

const AccessContext = createContext<AccessValue | null>(null);

/**
 * Niveau d'accès du compte connecté, pour tout le tableau de bord.
 *
 * ① Rendu immédiat avec le niveau du cookie (lu côté serveur et passé en
 *   `initialLevel` : le HTML du serveur et le premier rendu client sont
 *   identiques).
 * ② `/auth/me` fait foi : s'il contredit le cookie (rôle changé entre deux
 *   sessions), le cookie est réécrit et les requêtes parties sur le mauvais
 *   périmètre sont rejouées.
 * ③ L'application n'accepte QUE les comptes de son niveau (`appLevel`) :
 *   un autre compte voit un écran qui l'envoie vers son espace.
 *
 * Sans cookie (session ouverte avant cette version), on attend `/auth/me`
 * avant de rendre quoi que ce soit : aucun appel ne part sur un périmètre
 * deviné.
 */
export function AccessProvider({
  appLevel,
  initialLevel,
  children,
}: {
  /** Niveau servi par cette application (1 super admin, 2 admin, 3 client). */
  appLevel: AccessLevel;
  initialLevel: AccessLevel | null;
  children: ReactNode;
}) {
  const me = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const resolved = me.data ? levelOfUser(me.data) : null;
  // Un cookie d'un autre niveau ne vaut rien ici : on attend /auth/me.
  const level = resolved ?? (initialLevel === appLevel ? initialLevel : null);

  // ② cookie réaligné sur /auth/me — PENDANT le rendu, et non dans un effet :
  // les effets des enfants (où React Query lance ses requêtes) passent avant
  // ceux du parent, et liraient encore l'ancien périmètre. L'écriture est
  // idempotente ; seul le rejeu des requêtes est différé.
  const realigned = useRef(false);
  if (resolved && typeof document !== "undefined" && getAccessLevel() !== resolved) {
    realigned.current = initialLevel !== null; // sans cookie, rien n'est encore parti
    saveAccessLevel(resolved);
  }
  useEffect(() => {
    if (!realigned.current) return;
    realigned.current = false;
    void queryClient.resetQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
    router.refresh();
  });

  const value = useMemo<AccessValue | null>(() => {
    if (!level) return null;
    const permissions = me.data?.isPlatform ? ["*"] : (me.data?.permissions ?? LEVEL_DEFAULT_PERMISSIONS[level]);
    return {
      level,
      meta: LEVEL_META[level],
      user: me.data,
      permissions,
      can: (permission: string) => covers(permissions, permission),
      isPlatform: level === 1,
      isOrganizationAdmin: level === 2,
      isOperator: level === 3,
      organizationId: me.data?.organizationId,
      organizationName: me.data?.organization?.name,
    };
  }, [level, me.data]);

  if (!value) {
    if (me.isError) return <AccessError error={me.error} onRetry={() => void me.refetch()} />;
    return <FullPageSpinner label="Ouverture de votre espace…" />;
  }
  if (value.level !== appLevel) return <WrongSpace accountLevel={value.level} appLevel={appLevel} />;

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessValue {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error("useAccess() doit être utilisé sous <AccessProvider>.");
  return ctx;
}

/** Variante tolérante, pour les composants rendus aussi hors tableau de bord. */
export function useOptionalAccess(): AccessValue | null {
  return useContext(AccessContext);
}

/**
 * Affiche `children` si le compte détient l'habilitation (ou l'un des
 * niveaux listés). Masquer n'est pas autoriser : l'API refuse de toute façon.
 */
export function Can({
  permission,
  levels,
  fallback = null,
  children,
}: {
  permission?: string;
  levels?: readonly AccessLevel[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const access = useOptionalAccess();
  if (!access) return <>{fallback}</>;
  const okPermission = permission ? access.can(permission) : true;
  const okLevel = levels ? levels.includes(access.level) : true;
  return <>{okPermission && okLevel ? children : fallback}</>;
}

/* ------------------------------------------------------------------ états */

function FullPageSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center gap-3 text-muted-foreground text-sm">
      <Spinner />
      {label}
    </div>
  );
}

/** Compte d'un autre niveau : pas d'accès à cette application, lien vers la sienne. */
function WrongSpace({ accountLevel, appLevel }: { accountLevel: AccessLevel; appLevel: AccessLevel }) {
  const logout = useLogout();
  const target = LEVEL_META[accountLevel];
  const url = loginUrlOf(accountLevel);
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Ce compte n'a pas accès à l'{LEVEL_META[appLevel].space}</EmptyTitle>
          <EmptyDescription>
            Votre compte est un compte « {target.label} » : connectez-vous sur l'{target.space}.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          {url ? (
            <Button size="sm" asChild>
              <a href={url}>
                <ExternalLink data-icon="inline-start" />
                Aller sur l'{target.space}
              </a>
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut data-icon="inline-start" />
            Se déconnecter
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}

function AccessError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const logout = useLogout();
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <Empty className="max-w-md border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Impossible de vérifier votre compte</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Button size="sm" variant="outline" onClick={onRetry}>
            Réessayer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
            <LogOut data-icon="inline-start" />
            Se déconnecter
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
