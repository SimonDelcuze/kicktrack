# Archi

## Frontière front/back
- Server Components par défaut.
- `"use client"` uniquement pour les forms interactifs.
- Mutations : Server Actions.

## Persistance
- Une seule clé Vercel KV : `kicktrack:base` → tableau JSON `UserBrainrot[]`.
- Catalogue (raretés, mutations, brainrots) en code, dans `shared/data/`. Versionné.

## Calculs
- Toutes les fonctions de calcul sont pures, dans `shared/utils/calculations.ts`.
- Le client ne calcule jamais d'agrégat. Tout passe par Server Actions / Server Components.

## Sécurité
- Pas d'auth (tool privé, URL obscure).
- Pas de service-key client-side. Vercel KV creds = server-only env.
