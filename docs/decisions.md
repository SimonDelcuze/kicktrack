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

## 2026-05-13 — Simon (max-level display + level formula)
- Ajout `maxLevelIncome(brainrot)` + affichage du max sur chaque `BrainrotCard` (entre la mutation et l'income/s).
- `formatNumber` étendu (Qa/Qi/Sx/Sp/Oc/No/Dc) pour anticiper les grands ordres de grandeur.
- `level_growth_factor` = **1.25** (calibré depuis un Guerriro Digitale bacon : 14.7M au lvl 1 → 218.1T au lvl 75, soit base × 1.25^74 × 30).
- Convention conservée : level 1 = base, level 75 = base × factor^74.

## 2026-05-16 — Simon (Trade section)
- Ajout d'une section Trade en parallèle de Base, avec switcher de tabs sur la même page.
- Trade : pas de cap, level implicite 1, cartes groupées par `(brainrot, mutation)` avec compteur ± inline.
- Le dialog d'ajout devient section-aware : footer `[− N +]` (remplace le bouton Add). Marche identique pour Base et Trade.
- Journal de transactions persisté en KV (`kicktrack:trade:log`), affiché chat-style en bas du tab Trade, merging visuel par fenêtres de 5min, couleurs `+` vert / `−` rouge.
- Undo/redo Trade séparé (flèches dans la toolbar du tab Trade) ; Ctrl+Z reste dédié à Base.
- Spec : `docs/superpowers/specs/2026-05-16-trade-section-design.md`. Plan : `docs/superpowers/plans/2026-05-16-trade-section.md`.
- Build + test + lint = OK (54 tests verts).
