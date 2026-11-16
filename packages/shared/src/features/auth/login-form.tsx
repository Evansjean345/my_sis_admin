"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@shared/components/ui/alert";
import { Button } from "@shared/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@shared/components/ui/input-group";
import { Spinner } from "@shared/components/ui/spinner";
import { useLogin, WrongSpaceError } from "@shared/hooks/api/use-auth";
import { type AccessLevel, homeOf, LEVEL_META, loginUrlOf } from "@shared/lib/access/levels";
import { getErrorMessage } from "@shared/lib/axios";

const formSchema = z.object({
  email: z.email({ message: "Veuillez saisir une adresse e-mail valide." }),
  password: z.string().min(8, {
    message: "Le mot de passe doit contenir au moins 8 caractères.",
  }),
});

type LoginValues = z.infer<typeof formSchema>;

/** N'accepte qu'une redirection interne au dashboard (pas d'open redirect) ; sinon l'accueil. */
function safeNext(next: string | null, level: AccessLevel): string {
  if (!next?.startsWith("/dashboard") || next.startsWith("//")) return homeOf(level);
  return next;
}

/**
 * Connexion à UNE application : `appLevel` est le niveau qu'elle sert.
 * Un compte d'un autre niveau est refusé et renvoyé vers son espace.
 */
export function LoginForm({ appLevel }: { appLevel: AccessLevel }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin(appLevel);
  const [showPassword, setShowPassword] = useState(false);
  const [wrongSpace, setWrongSpace] = useState<AccessLevel | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginValues) {
    setWrongSpace(null);
    login.mutate(values, {
      onSuccess: ({ session, level }) => {
        toast.success(`Bienvenue, ${session.user.fullName}`);
        router.replace(safeNext(searchParams.get("next"), level));
        router.refresh();
      },
      onError: (error) => {
        if (error instanceof WrongSpaceError) {
          setWrongSpace(error.accountLevel);
          return;
        }
        toast.error("Connexion impossible", {
          description: getErrorMessage(error),
        });
      },
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {wrongSpace ? <WrongSpaceAlert accountLevel={wrongSpace} appLevel={appLevel} /> : null}
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Adresse e-mail</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                placeholder="admin@sisbm.ci"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                <Link
                  href="/auth/v2/forgot-password"
                  prefetch={false}
                  className="text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full bg-[#0E508D]" type="submit" disabled={login.isPending}>
        {login.isPending ? <Spinner data-icon="inline-start" /> : null}
        Se connecter
      </Button>
    </form>
  );
}

function WrongSpaceAlert({ accountLevel, appLevel }: { accountLevel: AccessLevel; appLevel: AccessLevel }) {
  const target = LEVEL_META[accountLevel];
  const url = loginUrlOf(accountLevel);
  return (
    <Alert variant="destructive">
      <AlertTitle>Ce compte n'a pas accès à l'{LEVEL_META[appLevel].space}</AlertTitle>
      <AlertDescription>
        <span>
          Votre compte est un compte « {target.label} ».{" "}
          {url ? (
            <a href={url} className="font-medium underline underline-offset-4">
              Connectez-vous sur l'{target.space}
            </a>
          ) : (
            <>Connectez-vous sur l'{target.space}.</>
          )}
        </span>
      </AlertDescription>
    </Alert>
  );
}
