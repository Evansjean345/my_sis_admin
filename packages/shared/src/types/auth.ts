export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Réponse de POST /auth/login et de POST /users/me/password. */
export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

/** GET /auth/me — enrichi de l'organisation, du rôle et des habilitations. */
export interface CurrentUser extends AuthUser {
  organizationId: string;
  roleId: string;
  phone?: string | null;
  lastLoginAt?: string | null;
  organization?: { id: string; code: string; name: string; isActive: boolean } | null;
  role?: { id: string; code: string; name: string } | null;
  /** Habilitations du rôle (`ressource:action`, jokers `ressource:*` et `*`). */
  permissions?: string[];
  /** Détient le joker `*` : exploitant de la plateforme (niveau 1). */
  isPlatform?: boolean;
}

/* ------------------------------------------------------------ mot de passe oublié */

/** POST /auth/password/forgot — le front n'utilise que le canal SMS. */
export interface ForgotPasswordPayload {
  /** E-mail OU téléphone du compte. */
  identifier: string;
  channel: "sms";
}

/** Réponse 202, identique que le compte existe ou non (non-divulgation). */
export interface ForgotPasswordResult {
  message: string;
  channel: "sms" | "email";
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface VerifyResetCodePayload {
  identifier: string;
  code: string;
}

export interface ResetPasswordPayload extends VerifyResetCodePayload {
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  newPassword_confirmation: string;
}
