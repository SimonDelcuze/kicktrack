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

## 2026-05-13 — Simon (max-level display)
- Ajout `maxLevelIncome(brainrot)` + affichage du max sur chaque `BrainrotCard` (entre la mutation et l'income/s).
- `formatNumber` étendu (Qa/Qi/Sx/Sp/Oc/No/Dc) pour anticiper les grands ordres de grandeur.
- `level_growth_factor` reste à 1.05 (placeholder, la formule exacte est toujours à confirmer — on a testé 1.5 mais ça donne des chiffres incohérents).
