# Decisions Log

## 2026-05-03 — Simon
- Setup initial : scaffold Next.js + structure projet.
- Décisions actées (cf. spec) : solo, no-auth, Vercel KV, catalogue en code.
- En cours : implémentation V1.

## 2026-05-03 — Simon (V1 ship)
- V1 implémentée (13 tâches, ~30min en parallèle subagent).
- Stack : Next.js 16 (scaffolder a installé 16, pas 15 comme prévu — backward-compatible, on garde).
- shadcn `form.tsx` a été écrit à la main (CLI shadcn a hung). Pas utilisé pour l'instant (les forms V1 sont des `<form action>` natifs avec shadcn Select/Input).
- Test fixtures : utilisent de vrais UUIDs (la 1ère version utilisait 'a'/'b' qui plantent la validation Zod stricte).
- Build + test + lint = OK.
- À faire : remplir `shared/data/brainrots.ts` avec les vraies données du jeu (pour l'instant 4 placeholder).
- Open : confirmer mutations cumulables ou pas + formule exacte de level.

## 2026-05-13 — Simon (level growth + max display)
- Formule level confirmée : `level_growth_factor = 1.5` pour tous les brainrots (×1.5 par level, max level = 75).
- Convention : level 1 = base, level 75 = base × 1.5^74 (cohérent avec `getMoneyPerSecAtLevel`).
- Ajout `maxLevelIncome(brainrot)` + affichage du max sur chaque `BrainrotCard` (entre la mutation et l'income/s).
- `formatNumber` étendu (Qa/Qi/Sx/Sp/Oc/No/Dc) pour gérer les ordres de grandeur au max level.
