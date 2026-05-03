# CLAUDE.md — KickTrack

Tool perso pour tracker la base d'un joueur dans le jeu Roblox "Kick a Lucky Block".

## Auto-chargement du contexte

@contexte/projet.md
@contexte/stack.md
@contexte/archi.md
@docs/decisions.md

## Règles d'archi (strict)

- `app/` UI-only. Pas de logique métier.
- `server/` server-only. Jamais importé depuis `"use client"`.
- `shared/` types + schémas Zod + utils purs. Importable des deux côtés.
- Toute écriture KV passe par `server/services/base.ts`.
- Tout calcul de level passe par `getMoneyPerSecAtLevel()` dans `shared/utils/calculations.ts`.

## Workflow

- Branche `main` deployée auto sur Vercel.
- Avant chaque push, update `docs/decisions.md` si décision non-triviale.
- `pnpm test` + `pnpm lint` + `pnpm build` doivent passer avant push.
