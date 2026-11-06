import type { ReactNode } from "react";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

import Background from "../../../../../media/loginPannel.jpeg";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl bg-primary lg:flex">
          {/* Image de fond */}
          <Image src={Background} alt="" fill priority placeholder="blur" className="object-cover" />
          {/* Overlay pour la lisibilité du texte */}
          <div className="absolute inset-0 bg-black/25" />

          <div className="absolute top-10 z-10 space-y-1 px-10 text-primary-foreground">
            <h1 className="font-medium text-2xl text-white">{APP_CONFIG.name}</h1>
            <p className="text-sm text-white">Supervision de flotte et géolocalisation en temps réel.</p>
          </div>
          <div className="absolute bottom-10 z-10 flex w-full justify-between px-10 text-white">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium text-white">Trackers connectés</h2>
              <p className="text-sm text-white">
                Suivez vos véhicules, diagnostiquez vos boîtiers et pilotez vos commandes à distance.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium text-white">Accès sécurisé</h2>
              <p className="text-sm text-white">
                Chaque commande sensible est tracée et soumise aux garde-fous de sécurité.
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
