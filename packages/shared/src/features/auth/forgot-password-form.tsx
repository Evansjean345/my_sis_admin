"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowLeft, Eye, EyeOff, MessageSquareText } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@shared/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@shared/components/ui/input-otp";
import { Spinner } from "@shared/components/ui/spinner";
import { useForgotPassword, useResetPassword, useVerifyResetCode } from "@shared/hooks/api/use-auth";
import { getErrorMessage, LOGIN_PATH } from "@shared/lib/axios";
import { ApiError } from "@shared/types/api";

/**
 * =========================================================================
 *  MOT DE PASSE OUBLIÉ — code par SMS uniquement
 * =========================================================================
 *
 * Un seul parcours pour les trois niveaux (la session n'existe pas encore,
 * le niveau n'est donc pas connu) :
 *
 *   ① e-mail OU téléphone du compte → POST /auth/password/forgot
 *     `{ identifier, channel: "sms" }` : le code part TOUJOURS par SMS, au
 *     téléphone enregistré sur le compte (jamais à un numéro saisi ici) ;
 *   ② code à 6 chiffres → POST /auth/password/verify (ne le consomme pas) ;
 *   ③ nouveau mot de passe → POST /auth/password/reset, puis connexion.
 *
 * L'API ne dit jamais si le compte existe (réponse 202 identique) : l'écran
 * non plus.
 */

type Step = "identifier" | "code" | "password";

const CODE_LENGTH = 6;

const identifierSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Saisissez votre e-mail ou votre numéro de téléphone.")
    .refine((v) => (v.includes("@") ? z.email().safeParse(v).success : /^[+\d\s().-]{8,24}$/.test(v)), {
      message: "E-mail ou numéro de téléphone invalide.",
    }),
});

const passwordSchema = z
  .object({
    password: z.string().min(12, "12 caractères minimum.").max(128, "128 caractères maximum."),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

type IdentifierValues = z.infer<typeof identifierSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

/** Secondes restantes avant `deadline` (ms), rafraîchies chaque seconde. */
function useCountdown(deadline: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(t);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1_000)) : 0;
}

function otpErrorMessage(error: unknown): { message: string; restart: boolean } {
  if (error instanceof ApiError) {
    if (error.code === "E_OTP_INVALID") {
      const left = Number(error.details.remainingAttempts);
      return {
        message: Number.isFinite(left)
          ? `Code incorrect. ${left} tentative${left > 1 ? "s" : ""} restante${left > 1 ? "s" : ""}.`
          : "Code incorrect.",
        restart: false,
      };
    }
    if (error.code === "E_OTP_EXPIRED") return { message: "Ce code a expiré. Demandez-en un nouveau.", restart: true };
    if (error.code === "E_OTP_ATTEMPTS_EXCEEDED")
      return { message: "Trop de tentatives sur ce code. Demandez-en un nouveau.", restart: true };
  }
  return { message: getErrorMessage(error), restart: false };
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const forgot = useForgotPassword();
  const verify = useVerifyResetCode();
  const reset = useResetPassword();
  const resendIn = useCountdown(resendAt);

  const identifierForm = useForm<IdentifierValues>({
    resolver: zodResolver(identifierSchema),
    defaultValues: { identifier: "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  function requestCode(value: string) {
    forgot.mutate(
      { identifier: value, channel: "sms" },
      {
        onSuccess: (result) => {
          setIdentifier(value);
          setCode("");
          setCodeError(null);
          setResendAt(Date.now() + (result.resendAfterSeconds ?? 60) * 1_000);
          setStep("code");
        },
        onError: (error) => toast.error("Envoi impossible", { description: getErrorMessage(error) }),
      },
    );
  }

  function submitCode(value = code) {
    if (value.length !== CODE_LENGTH || verify.isPending) return;
    setCodeError(null);
    verify.mutate(
      { identifier, code: value },
      {
        onSuccess: () => setStep("password"),
        onError: (error) => {
          const { message, restart } = otpErrorMessage(error);
          setCode("");
          setCodeError(message);
          if (restart) setResendAt(null);
        },
      },
    );
  }

  function submitPassword(values: PasswordValues) {
    reset.mutate(
      { identifier, code, ...values },
      {
        onSuccess: () => {
          toast.success("Mot de passe modifié", {
            description: "Toutes vos sessions ont été fermées. Connectez-vous avec le nouveau mot de passe.",
          });
          router.replace(LOGIN_PATH);
        },
        onError: (error) => {
          const { message, restart } = otpErrorMessage(error);
          if (restart || (error instanceof ApiError && error.code.startsWith("E_OTP"))) {
            setCodeError(message);
            setCode("");
            setStep("code");
            return;
          }
          toast.error("Réinitialisation impossible", { description: message });
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ① identifiant */}
      {step === "identifier" ? (
        <form
          noValidate
          onSubmit={identifierForm.handleSubmit((v) => requestCode(v.identifier.trim()))}
          className="flex flex-col gap-4"
        >
          <FieldGroup className="gap-4">
            <Controller
              control={identifierForm.control}
              name="identifier"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="forgot-identifier">E-mail ou téléphone du compte</FieldLabel>
                  <Input
                    {...field}
                    id="forgot-identifier"
                    placeholder="vous@entreprise.ci ou 07 00 00 00 00"
                    autoComplete="username"
                    autoFocus
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>Le code est envoyé par SMS au numéro enregistré sur votre compte.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <Button className="w-full bg-[#0E508D]" type="submit" disabled={forgot.isPending}>
            {forgot.isPending ? <Spinner data-icon="inline-start" /> : <MessageSquareText data-icon="inline-start" />}
            Recevoir le code par SMS
          </Button>
        </form>
      ) : null}

      {/* ② code SMS */}
      {step === "code" ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submitCode();
          }}
          className="flex flex-col gap-4"
        >
          <Alert>
            <MessageSquareText className="size-4" />
            <AlertDescription>
              Si un compte actif correspond à <span className="font-medium text-foreground">{identifier}</span>, un code
              à {CODE_LENGTH} chiffres vient d'être envoyé par SMS. Il est valable 10 minutes.
            </AlertDescription>
          </Alert>

          <Field className="items-center gap-2" data-invalid={Boolean(codeError)}>
            <FieldLabel htmlFor="forgot-code" className="sr-only">
              Code reçu par SMS
            </FieldLabel>
            <InputOTP
              id="forgot-code"
              maxLength={CODE_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={(v) => {
                setCode(v);
                setCodeError(null);
              }}
              onComplete={(v: string) => submitCode(v)}
              autoFocus
              // Pas de `disabled` pendant la vérification : le champ garderait sinon
              // le focus perdu, et la saisie suivante (après un code faux) partirait dans le vide.
              autoComplete="one-time-code"
              inputMode="numeric"
            >
              <InputOTPGroup>
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: cases positionnelles
                  <InputOTPSlot key={i} index={i} aria-invalid={Boolean(codeError)} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            {codeError ? <FieldError>{codeError}</FieldError> : null}
          </Field>

          <Button
            className="w-full bg-[#0E508D]"
            type="submit"
            disabled={verify.isPending || code.length !== CODE_LENGTH}
          >
            {verify.isPending ? <Spinner data-icon="inline-start" /> : null}
            Vérifier le code
          </Button>

          <div className="flex items-center justify-between gap-2 text-sm">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => {
                setStep("identifier");
                setCodeError(null);
              }}
            >
              Modifier l'identifiant
            </Button>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              disabled={resendIn > 0 || forgot.isPending}
              onClick={() => requestCode(identifier)}
            >
              {resendIn > 0 ? `Renvoyer le code (${resendIn} s)` : "Renvoyer le code"}
            </Button>
          </div>
        </form>
      ) : null}

      {/* ③ nouveau mot de passe */}
      {step === "password" ? (
        <form noValidate onSubmit={passwordForm.handleSubmit(submitPassword)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={passwordForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password">Nouveau mot de passe</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      autoFocus
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>12 caractères minimum.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={passwordForm.control}
              name="password_confirmation"
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="reset-password-confirmation">Confirmer le mot de passe</FieldLabel>
                  <Input
                    {...field}
                    id="reset-password-confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <Button className="w-full bg-[#0E508D]" type="submit" disabled={reset.isPending}>
            {reset.isPending ? <Spinner data-icon="inline-start" /> : null}
            Changer le mot de passe
          </Button>
        </form>
      ) : null}

      <Button variant="ghost" size="sm" asChild className="self-center">
        <Link href={LOGIN_PATH} prefetch={false}>
          <ArrowLeft data-icon="inline-start" />
          Retour à la connexion
        </Link>
      </Button>
    </div>
  );
}
