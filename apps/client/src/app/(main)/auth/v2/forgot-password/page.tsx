import Image from "next/image";

import { ShieldCheck } from "lucide-react";

import Logo from "@shared/assets/sisbm-core.jpeg";
import { APP_CONFIG } from "@shared/config/app-config";
import { ForgotPasswordForm } from "@shared/features/auth/forgot-password-form";

/** Mot de passe oublié — commun aux trois niveaux, code reçu par SMS uniquement. */
export default function ForgotPasswordPage() {
  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 px-4 sm:w-87.5 sm:px-0">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Image src={Logo} alt="Logo" className="h-24 w-24 rounded-lg object-contain" />
          <h1 className="font-medium text-3xl">Mot de passe oublié</h1>
          <p className="text-muted-foreground text-sm">
            Recevez un code par SMS pour définir un nouveau mot de passe {APP_CONFIG.name}.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <ShieldCheck className="size-4 text-muted-foreground" />
          FR
        </div>
      </div>
    </>
  );
}
