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

## 2026-05-16 — Simon (Trade op cache)
- Click sur ± dans Trade ne touche plus la DB directement — un cache d'opérations local est drainé toutes les 10s (+ sur unmount / tab hide / beforeunload).
- Indicateur "Saving N…" quand la queue n'est pas vide.
- Le chat log reste basé sur le state serveur (les events apparaissent au flush suivant — acceptable).
- Undo Trade clear la queue avant de snapper l'état serveur au snapshot.
- Base reste instant (l'éviction côté serveur complique le batch, et le cap 30 fait que les clics sont rares).

## 2026-05-18 — Simon (multi-profile via /u/[slug])
- Architecture multi-profil : chaque profil a son propre namespace KV (`kicktrack:${slug}:base/trade/log`).
- URL : `/u/[slug]` par profil. Slug = 10 caractères `[a-z0-9]` aléatoires. La racine `/` est une landing minimale avec bouton "Create new profile" qui génère un slug et redirige.
- Pas d'auth — le slug est l'identifiant secret (URL obscure).
- `SIMON_SLUG = 'swym0wnrz5'` hardcodé dans `server/lib/kv.ts`.
- Migration one-shot : au premier `getBase/getTrade/getTradeLog` avec `SIMON_SLUG`, si la clé préfixée est vide mais la clé legacy (`kicktrack:base` etc.) existe, les données sont copiées vers la clé préfixée et la clé legacy est supprimée. Transparent au premier accès post-deploy.
- `HistoryProvider` déplacé de `app/layout.tsx` vers `app/u/[slug]/page.tsx` (reçoit le slug en prop).
- Nav utilise `useOptionalHistory()` + `useSlug()` : les boutons undo/redo et settings sont masqués sur `/` (pas de slug).
- Tous les server actions prennent `slug: string` en premier argument. Tous les composants clients reçoivent et transmettent le slug.
- Tests mis à jour : mock de `@/server/lib/kv` exporte les key-builders (`baseKey`, `tradeKey`, `tradeLogKey`) et les constantes legacy. Nouveaux tests de migration dans chaque suite de service.
- Build + test + lint = OK.
