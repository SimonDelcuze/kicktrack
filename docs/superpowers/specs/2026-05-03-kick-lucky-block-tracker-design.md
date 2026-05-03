# KickTrack — Design Spec

**Date :** 2026-05-03
**Auteur :** Simon
**Statut :** Draft pour review (V3 — minimal, solo, no-auth)
**Codename projet :** KickTrack

---

## 1. Contexte & objectif

Tool web **privé** (Simon only) pour tracker sa base dans **Kick a Lucky Block** (Roblox). Hosted sur Vercel pour être accessible depuis n'importe quel device.

**Pas d'auth, pas de sécu, pas de multi-user.** L'URL est obscure → security by obscurity assumée.

Quelqu'un qui trouve l'URL peut lire/éditer la base — risque accepté par Simon.

---

## 2. Scope V1

### Inclus
- Liste de la base perso (les brainrots possédés)
- Ajout / édition / suppression d'un brainrot dans la base
- Calcul automatique du revenu/sec total et valeur totale
- Vue catalogue (lecture seule) avec stats max théorique
- Persistance via **Vercel KV** (sync cross-device)
- Export/Import JSON (backup local manuel)

### Hors-scope
Tout le reste : auth, accounts, leaderboards, social, mobile app, multi-langue, analytics, crowdsourcing, theming, etc.

---

## 3. Données

### 3.1. Catalogue — en code (pas en DB)

Stocké dans `shared/data/` :

- `rarities.ts` — array des raretés du jeu
- `mutations.ts` — array des 9 mutations (gold, diamond, plasma, molten, radioactive, shadow, electrified, rainbow, void) avec leurs multipliers
- `brainrots.ts` — array des brainrots du jeu : `id`, `name`, `rarity`, `base_money_per_sec`, `level_growth_factor`

Modif catalogue = edit fichier + commit + push (Vercel redeploy auto).

### 3.2. Base perso — Vercel KV

Une seule clé : `kicktrack:base` → tableau JSON :

```ts
type UserBrainrot = {
  id: string;             // uuid v4
  brainrot_id: number;
  mutation_id: number | null;
  level: number;          // 1..75
  nickname?: string;
  created_at: string;
  updated_at: string;
};
```

### 3.3. Calculs

Fonctions TS pures dans `shared/utils/calculations.ts` :
- `currentMoneyPerSec(brainrot, level, mutation)` — pour 1 brainrot
- `totalIncome(base)` — somme sur la base
- `maxPotential(brainrot)` — niveau 75 + meilleure mutation

Tests unitaires sur ces fonctions (cœur du produit, pas négociable).

---

## 4. Architecture

```
KickTrack/
├── app/
│   ├── page.tsx                  # Dashboard
│   ├── add/page.tsx              # Ajouter
│   ├── brainrot/[id]/page.tsx    # Edit/delete
│   ├── catalog/page.tsx          # Vue catalogue
│   └── settings/page.tsx         # Export/Import
├── server/
│   ├── services/base.ts          # CRUD KV
│   └── lib/kv.ts                 # Client Vercel KV
├── shared/
│   ├── data/                     # Catalogue
│   ├── types/
│   ├── schemas/                  # Zod
│   └── utils/calculations.ts
├── components/
│   ├── ui/                       # shadcn
│   └── brainrot/
└── ...
```

**Règles** : pas d'import `server/` côté `"use client"`, calculs/écritures via Server Actions.

---

## 5. Stack

Next.js 15 (App Router) · Vercel KV · TypeScript · Zod · Tailwind + shadcn/ui · React Hook Form · Vitest · pnpm · Vercel hosting.

---

## 6. Pages

| Route | Description |
|---|---|
| `/` | Dashboard : revenu/sec total + valeur totale en gros + grille des brainrots |
| `/add` | Formulaire ajout (autocomplete brainrot, level, mutation) |
| `/brainrot/[id]` | Édition/suppression |
| `/catalog` | Liste de tous les brainrots avec potentiel max |
| `/settings` | Export JSON, Import JSON |

---

## 7. Coût

**0 €/mois.** Vercel Hobby + Vercel KV free tier (30K cmds/mois, on en utilise <300/mois).

---

## 8. Tests

- Unitaires sur `calculations.ts` (Vitest)
- Light intégration sur `services/base.ts` (mock KV)
- Pas d'E2E

---

## 9. Déploiement

- 1 projet Vercel + KV provisionné via dashboard (1 click)
- Branche `main` → preprod, branche `production` → prod (à arbitrer plus tard, V1 peut tout déployer sur main)
- ENV vars KV auto-injectées par Vercel

---

## 10. Décisions actées

- Solo, no-auth, public URL obscure assumée comme "soft secret"
- Vercel KV (1 clé), pas de Supabase, pas de SQL
- Catalogue en code TypeScript versionné (pas d'admin panel)
- Export/Import JSON pour backup manuel régulier

---

## 11. Open questions pour l'implémentation

- **Mutations cumulables ou non** — à reconfirmer
- **Formule de progression de niveau** — géométrique simple ou table de paliers ? Dépend des données réelles
- **Liste exacte des raretés** du jeu — Simon fournit
- **Liste exacte des brainrots** + stats de base — Simon fournit
- **Multipliers des 9 mutations** — Simon fournit
- **Définition de "argent max"** — formule exacte côté jeu ?

---

## 12. Critères de complétion V1

- [x] Spec validé
- [ ] Catalogue rempli avec données réelles
- [ ] CRUD base via Vercel KV fonctionnel
- [ ] Dashboard affiche revenu/sec total et valeur correctement
- [ ] Vue catalogue OK
- [ ] Export/Import JSON OK
- [ ] Tests unitaires `calculations.ts` verts
- [ ] Déployé sur Vercel
