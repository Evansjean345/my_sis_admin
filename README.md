# SISBM CORE — Tableaux de bord (monorepo)

Trois applications Next.js **séparées**, une par niveau d'accès, qui partagent leur code dans `packages/shared`.

| Application | Niveau | Rôle API | Dossier | Port dev | Adresse prévue |
|---|---|---|---|---|---|
| Espace Super Admin | 1 | `super_admin` | `apps/superadmin` | 3000 | superadmin.sisbm-core.com |
| Espace Administration | 2 | `admin` | `apps/admin` | 3001 | admin.sisbm-core.com |
| Espace Client | 3 | `operator` | `apps/client` | 3002 | app.sisbm-core.com |

Chaque application se construit et se déploie seule. Elle n'ouvre de session **qu'aux comptes de son niveau** :
un compte d'un autre niveau est refusé à la connexion (son jeton est révoqué) et renvoyé vers son espace.

```
apps/
├─ superadmin/   routes historiques /dashboard/... (inchangées)
├─ admin/        /dashboard = accueil de l'organisation
└─ client/       /dashboard = suivi temps réel de l'opérateur
packages/
└─ shared/       @sisbm/shared — alias d'import `@shared/*`
   └─ src/
      ├─ features/      écrans (véhicules, trackers, flotte, horaires, accueils…)
      ├─ components/    UI (shadcn) et providers (accès, temps réel, React Query)
      ├─ services/      appels API — `scopedPath()` choisit /admin/* (niveau 1) ou les routes d'organisation
      ├─ hooks/ lib/ types/ stores/ styles/ assets/
      └─ navigation/types.ts
```

Dans une application : `src/app` (routes), `src/navigation` (menu), `src/config/app.ts` (niveau servi),
`src/proxy.ts` (garde des routes). Tout le reste vient de `@shared/*`.

## Démarrer

```bash
npm install                 # à la racine : installe les 4 paquets (workspaces npm)
cp apps/admin/.env.example apps/admin/.env   # idem pour superadmin et client
npm run dev:superadmin      # http://localhost:3000
npm run dev:admin           # http://localhost:3001
npm run dev:client          # http://localhost:3002
```

Variables (par application) :

- `NEXT_PUBLIC_URL` : URL de l'API SISBM CORE, sans `/api/v1`.
- `NEXT_PUBLIC_SUPERADMIN_APP_URL`, `NEXT_PUBLIC_ADMIN_APP_URL`, `NEXT_PUBLIC_CLIENT_APP_URL` :
  adresses publiques des trois espaces, pour renvoyer un compte vers le bon.

## Construire / déployer

```bash
npm run build               # les trois
npm run build:admin         # une seule
npm run start -w @sisbm/admin
```

Déployer chaque dossier `apps/<appli>` comme un projet indépendant (racine du monorepo = répertoire de travail,
pour que `packages/shared` soit présent). Un domaine par application : les sessions (cookies) sont séparées.

## Temps réel

Positions et état des boîtiers arrivent par **AdonisJS Transmit (SSE)**, déjà exposé par l'API
(`/__transmit/events`, canaux `org/<id>/positions` et `org/<id>/devices`). L'abonnement est authentifié par le jeton.
En production, le CORS de l'API doit autoriser chaque domaine avec `credentials`.

## Mot de passe oublié

`/auth/v2/forgot-password` dans les trois applications : code à 6 chiffres **par SMS uniquement**
(`POST /auth/password/forgot { identifier, channel: "sms" }`), vérification, nouveau mot de passe.

## Qualité

```bash
npm run typecheck           # tsc dans chaque paquet
npm run check               # Biome (lint + format)
```
