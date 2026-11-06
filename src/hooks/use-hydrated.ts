import { useSyncExternalStore } from "react";

/** Rien à écouter : seule compte la différence entre instantané serveur et client. */
const subscribe = () => () => undefined;

/**
 * `false` côté serveur ET pendant le rendu d'hydratation, `true` ensuite.
 *
 * À utiliser quand un composant lit, dès son premier rendu, des données qui
 * n'existent que dans le navigateur (cache React Query rempli par un autre
 * composant, jeton en localStorage…). Un `<Suspense>` est hydraté APRÈS le
 * reste de la page : le temps qu'il le soit, ces données ont pu arriver, et
 * son premier rendu client ne correspondrait plus au HTML du serveur
 * (« Hydration failed »). Attendre `useHydrated()` garantit un premier rendu
 * identique des deux côtés, puis bascule sur les vraies données.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
