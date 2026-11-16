"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@shared/hooks/api/query-keys";
import { type AccessLevel, levelOf } from "@shared/lib/access/levels";
import { clearSession, getToken, saveAccessLevel, saveSession } from "@shared/lib/auth-token";
import { LOGIN_PATH } from "@shared/lib/axios";
import { closeTransmit } from "@shared/lib/realtime/transmit";
import { authService } from "@shared/services/auth.service";
import type {
  AuthSession,
  ChangePasswordPayload,
  CurrentUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  VerifyResetCodePayload,
} from "@shared/types/auth";

/** Utilisateur courant (GET /auth/me). */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.me,
    enabled: typeof document !== "undefined" && Boolean(getToken()),
    staleTime: 5 * 60_000,
  });
}

/** Niveau d'un utilisateur courant tel que renvoyé par `/auth/me`. */
export function levelOfUser(user: CurrentUser): AccessLevel {
  return levelOf({ roleCode: user.role?.code, permissions: user.isPlatform ? ["*"] : user.permissions });
}

/**
 * Le compte relève d'une AUTRE application (ex. un opérateur sur l'espace
 * Super Admin). Le jeton fraîchement émis est révoqué : aucune session ne
 * reste ouverte dans la mauvaise application.
 */
export class WrongSpaceError extends Error {
  constructor(readonly accountLevel: AccessLevel) {
    super("Ce compte relève d'un autre espace.");
    this.name = "WrongSpaceError";
  }
}

export interface LoginResult {
  session: AuthSession;
  user: CurrentUser;
  level: AccessLevel;
}

/**
 * Connexion en deux temps : jeton, puis `/auth/me` pour connaître le niveau
 * AVANT la première navigation. Le proxy et le périmètre d'API (`/admin/*`
 * ou non) en dépendent : sans lui, un administrateur d'organisation
 * atterrirait sur l'accueil plateforme et recevrait des 403.
 */
export function useLogin(appLevel: AccessLevel) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload): Promise<LoginResult> => {
      const session = await authService.login(payload);
      queryClient.clear();
      saveSession(session);
      const user = await authService.me();
      const level = levelOfUser(user);
      if (level !== appLevel) {
        await authService.logout().catch(() => undefined);
        throw new WrongSpaceError(level);
      }
      saveAccessLevel(level, session.expiresAt);
      return { session, user, level };
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(queryKeys.auth.me, user);
    },
    onError: () => {
      // Jeton obtenu mais `/auth/me` en échec : pas de demi-session.
      clearSession();
    },
  });
}

/* ------------------------------------------------------------ mot de passe oublié (SMS) */

export function useForgotPassword() {
  return useMutation({ mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload) });
}

export function useVerifyResetCode() {
  return useMutation({ mutationFn: (payload: VerifyResetCodePayload) => authService.verifyResetCode(payload) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload) });
}

/** Organisation du compte connecté (GET /organization). */
export function useCurrentOrganization(enabled = true) {
  return useQuery({
    queryKey: queryKeys.organization.current,
    queryFn: authService.currentOrganization,
    enabled: enabled && typeof document !== "undefined" && Boolean(getToken()),
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authService.logout().catch(() => undefined),
    onSettled: () => {
      closeTransmit();
      clearSession();
      // Navigation complète : le cache React Query et les requêtes montées disparaissent avec la page,
      // aucune requête ne repart sans jeton.
      window.location.replace(LOGIN_PATH);
    },
  });
}

/** Le changement de mot de passe révoque les jetons : on stocke le nouveau. */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authService.changePassword(payload),
    onSuccess: (session) => {
      saveSession(session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
