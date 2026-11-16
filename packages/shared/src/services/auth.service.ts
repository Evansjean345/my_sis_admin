import { api } from "@shared/lib/axios";
import type { ApiResponse } from "@shared/types/api";
import type {
  AuthSession,
  ChangePasswordPayload,
  CurrentUser,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  LoginPayload,
  ResetPasswordPayload,
  VerifyResetCodePayload,
} from "@shared/types/auth";
import type { Organization } from "@shared/types/organization";

export const authService = {
  /** POST /auth/login */
  async login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await api.post<ApiResponse<AuthSession>>("/auth/login", payload);
    return data.data;
  },

  /** GET /auth/me */
  async me(): Promise<CurrentUser> {
    const { data } = await api.get<ApiResponse<CurrentUser>>("/auth/me");
    return data.data;
  },

  /** POST /auth/logout — révoque le jeton courant. */
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  /** GET /organization — l'organisation du compte connecté (seule lecture ouverte au client). */
  async currentOrganization(): Promise<Organization> {
    const { data } = await api.get<ApiResponse<Organization>>("/organization");
    return data.data;
  },

  /**
   * POST /auth/password/forgot — envoie un code à 6 chiffres PAR SMS au
   * téléphone du compte, que l'identifiant saisi soit son e-mail ou son
   * numéro. Toujours 202 : la réponse ne dit pas si le compte existe.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResult> {
    const { data } = await api.post<ApiResponse<ForgotPasswordResult>>("/auth/password/forgot", payload);
    return data.data;
  },

  /** POST /auth/password/verify — vérifie le code SANS le consommer (chaque échec compte). */
  async verifyResetCode(payload: VerifyResetCodePayload): Promise<{ valid: true; expiresAt: string }> {
    const { data } = await api.post<ApiResponse<{ valid: true; expiresAt: string }>>("/auth/password/verify", payload);
    return data.data;
  },

  /** POST /auth/password/reset — 204 : mot de passe changé, toutes les sessions révoquées. */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await api.post("/auth/password/reset", payload);
  },

  /** POST /users/me/password — renvoie une NOUVELLE session (les anciens jetons sont révoqués). */
  async changePassword(payload: ChangePasswordPayload): Promise<AuthSession> {
    const { data } = await api.post<ApiResponse<AuthSession>>("/users/me/password", payload);
    return data.data;
  },
};
