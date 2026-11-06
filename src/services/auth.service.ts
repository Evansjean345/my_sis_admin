import { api } from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AuthSession, ChangePasswordPayload, CurrentUser, LoginPayload } from "@/types/auth";

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

  /** POST /users/me/password — renvoie une NOUVELLE session (les anciens jetons sont révoqués). */
  async changePassword(payload: ChangePasswordPayload): Promise<AuthSession> {
    const { data } = await api.post<ApiResponse<AuthSession>>("/users/me/password", payload);
    return data.data;
  },
};
