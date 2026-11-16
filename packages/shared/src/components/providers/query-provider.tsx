"use client";

import { type ReactNode, useState } from "react";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiError } from "@shared/types/api";

function shouldRetry(failureCount: number, error: unknown) {
  // Inutile de réessayer une erreur fonctionnelle (4xx) : seul le réseau / 5xx vaut une relance.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const queryClient: QueryClient = new QueryClient({
      /**
       * Toute écriture réussie (création, suppression, montage, commande…)
       * périme les compteurs du tableau de bord admin : l'accueil est à jour
       * dès qu'on y revient, sans attendre le rafraîchissement de 60 s.
       */
      mutationCache: new MutationCache({
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
      }),
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
          retry: shouldRetry,
        },
        mutations: { retry: false },
      },
    });
    return queryClient;
  });

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
