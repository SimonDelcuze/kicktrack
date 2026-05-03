# KickTrack V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a personal, no-auth Roblox brainrot base tracker hosted on Vercel with Vercel KV persistence.

**Architecture:** Next.js 15 App Router server-rendered tool. Catalog (rarities, mutations, brainrots) stored as TypeScript constants in `shared/data/`. The user's base persists as a JSON array under a single Vercel KV key. All calculations are pure TypeScript functions executed server-side via Server Actions; the client never handles raw aggregation.

**Tech Stack:** Next.js 15, TypeScript, `@upstash/redis` (compatible with Vercel KV / Upstash for Redis), Zod, Tailwind, shadcn/ui, React Hook Form, Vitest, pnpm.

---

## File Structure (target)

```
KickTrack/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
├── vitest.config.ts
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md
├── contexte/
│   ├── projet.md
│   ├── stack.md
│   └── archi.md
├── docs/
│   ├── decisions.md
│   └── superpowers/
│       ├── specs/2026-05-03-kick-lucky-block-tracker-design.md
│       └── plans/2026-05-03-kicktrack-v1.md
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                      # Dashboard
│   ├── add/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── brainrot/[id]/
│   │   ├── page.tsx
│   │   └── actions.ts
│   ├── catalog/page.tsx
│   └── settings/
│       ├── page.tsx
│       └── actions.ts
├── server/
│   ├── lib/kv.ts                     # @upstash/redis client wrapper
│   └── services/base.ts              # CRUD on user base
├── shared/
│   ├── data/
│   │   ├── rarities.ts
│   │   ├── mutations.ts
│   │   └── brainrots.ts
│   ├── types/index.ts
│   ├── schemas/user-brainrot.ts
│   └── utils/
│       ├── calculations.ts
│       └── format.ts
├── components/
│   ├── ui/                           # shadcn primitives
│   ├── stats/StatsHeader.tsx
│   └── brainrot/
│       ├── BrainrotCard.tsx
│       ├── AddBrainrotForm.tsx
│       └── EditBrainrotForm.tsx
└── tests/
    ├── calculations.test.ts
    ├── format.test.ts
    └── base-service.test.ts
```

**Boundary rules:**
- `app/` is UI-only. No business logic.
- `server/` is server-only. Never imported from `"use client"` code.
- `shared/` is pure data + pure functions. Importable from both sides.
- All KV access goes through `server/services/base.ts`.
- All level math goes through `getMoneyPerSecAtLevel()` in `shared/utils/calculations.ts` (single point to swap formula vs table).

---

## Task 1: Scaffold Next.js project + project methodology files

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.env.example`, `README.md`, `CLAUDE.md`, `contexte/projet.md`, `contexte/stack.md`, `contexte/archi.md`, `docs/decisions.md`

- [ ] **Step 1: Move existing docs/ aside, scaffold, restore**

`pnpm create next-app .` refuses non-empty directories. Move `docs/` out, scaffold, move it back. Run from `D:\KickTrack`:

```bash
mv docs ../kicktrack-docs-tmp
pnpm create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
mv ../kicktrack-docs-tmp docs
```
Expected: scaffolder runs, `app/`, `package.json`, etc. created. The `docs/` folder with the spec and this plan is restored.

- [ ] **Step 2: Verify dev server runs**

Run:
```bash
pnpm dev
```
Expected: server boots on `http://localhost:3000` with the default Next.js page. Stop with Ctrl+C.

- [ ] **Step 3: Replace default `app/page.tsx` with placeholder**

Overwrite `app/page.tsx` with:
```tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">KickTrack</h1>
      <p className="text-sm text-neutral-500">Dashboard coming soon.</p>
    </main>
  );
}
```

- [ ] **Step 4: Create `.env.example`**

Write to `.env.example`:
```
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

- [ ] **Step 5: Append to `.gitignore`**

Append:
```
.env*.local
.vercel
coverage/
```

- [ ] **Step 6: Create `CLAUDE.md`**

Write to `CLAUDE.md`:
```markdown
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
```

- [ ] **Step 7: Create `contexte/projet.md`**

Write to `contexte/projet.md`:
```markdown
# Projet KickTrack

## Vision
Outil web perso pour tracker sa base de brainrots dans le jeu Roblox "Kick a Lucky Block".

## Audience
Simon uniquement. Pas de multi-user, pas d'auth.

## V1 Features
- CRUD de la base perso
- Calcul revenu/sec total et valeur totale
- Vue catalogue
- Export/Import JSON

## Hors-scope V1
Multi-user, auth, leaderboards, social, mobile app, multi-langue.
```

- [ ] **Step 8: Create `contexte/stack.md`**

Write to `contexte/stack.md`:
```markdown
# Stack

- Next.js 15 (App Router)
- TypeScript strict
- Vercel hosting
- Vercel KV (via `@upstash/redis`) — persistance
- Tailwind + shadcn/ui — UI
- React Hook Form + Zod — forms et validation
- Vitest — tests unitaires
- pnpm

## Pourquoi
- Vercel KV : sync cross-device, free tier OK pour 1 user.
- shadcn : composants headless, on contrôle le style.
- @upstash/redis plutôt que @vercel/kv : compatible avec marketplace Vercel actuelle.
```

- [ ] **Step 9: Create `contexte/archi.md`**

Write to `contexte/archi.md`:
```markdown
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
```

- [ ] **Step 10: Create `docs/decisions.md`**

Write to `docs/decisions.md`:
```markdown
# Decisions Log

## 2026-05-03 — Simon
- Setup initial : scaffold Next.js + structure projet.
- Décisions actées (cf. spec) : solo, no-auth, Vercel KV, catalogue en code.
- En cours : implémentation V1.
```

- [ ] **Step 11: Init git and first commit**

Run:
```bash
git init
git add .
git commit -m "chore: initial scaffold + project methodology files"
```

---

## Task 2: Install runtime + dev dependencies, configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`, `tests/smoke.test.ts`

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
pnpm add @upstash/redis zod react-hook-form @hookform/resolvers uuid
pnpm add -D @types/uuid
```

- [ ] **Step 2: Install dev dependencies for Vitest**

Run:
```bash
pnpm add -D vitest @vitest/ui
```

- [ ] **Step 3: Create `vitest.config.ts`**

Write:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Add `test` scripts to `package.json`**

In `package.json`'s `"scripts"` object, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Write smoke test**

Create `tests/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run smoke test**

Run:
```bash
pnpm test
```
Expected: PASS, 1 test passed.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: install deps + configure Vitest"
```

---

## Task 3: Initialize shadcn/ui and install primitives

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/*` (button, input, card, label, dialog, badge, sonner, select, slider, textarea)

- [ ] **Step 1: Run shadcn init**

Run:
```bash
pnpm dlx shadcn@latest init -d
```
The `-d` flag accepts defaults (Slate base color, CSS variables). This creates `components.json`, `lib/utils.ts`, and updates `app/globals.css` with theme tokens.

- [ ] **Step 2: Install primitives we'll need**

Run:
```bash
pnpm dlx shadcn@latest add button input label card dialog badge sonner select slider textarea form
```

- [ ] **Step 3: Verify build still passes**

Run:
```bash
pnpm build
```
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: init shadcn/ui + install primitives"
```

---

## Task 4: Define types and Zod schemas

**Files:**
- Create: `shared/types/index.ts`, `shared/schemas/user-brainrot.ts`

- [ ] **Step 1: Create `shared/types/index.ts`**

Write:
```ts
export type Rarity = {
  id: number;
  name: string;
  tier_order: number;
  color_hex: string;
};

export type Mutation = {
  id: number;
  name: string;
  multiplier: number;
  color_hex: string;
  tier_order: number;
};

export type Brainrot = {
  id: number;
  name: string;
  rarity_id: number;
  base_money_per_sec: number;
  level_growth_factor: number;
  image_url?: string;
};

export type UserBrainrot = {
  id: string;
  brainrot_id: number;
  mutation_id: number | null;
  level: number;
  nickname?: string;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 2: Create `shared/schemas/user-brainrot.ts`**

Write:
```ts
import { z } from 'zod';

export const userBrainrotInputSchema = z.object({
  brainrot_id: z.number().int().positive(),
  mutation_id: z.number().int().positive().nullable(),
  level: z.number().int().min(1).max(75),
  nickname: z.string().trim().max(50).optional(),
});

export const userBrainrotSchema = userBrainrotInputSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const userBrainrotArraySchema = z.array(userBrainrotSchema);

export type UserBrainrotInput = z.infer<typeof userBrainrotInputSchema>;
```

- [ ] **Step 3: Verify typecheck**

Run:
```bash
pnpm tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add shared/
git commit -m "feat: add types and Zod schemas"
```

---

## Task 5: Catalog data scaffolding (placeholder)

**Files:**
- Create: `shared/data/rarities.ts`, `shared/data/mutations.ts`, `shared/data/brainrots.ts`

> **Note:** Real values to be filled in by Simon. Placeholders use plausible but fake numbers so the rest of the app works end-to-end.

- [ ] **Step 1: Create `shared/data/rarities.ts`**

Write:
```ts
import type { Rarity } from '@/shared/types';

// PLACEHOLDER — real game rarities to be confirmed by Simon.
export const rarities: readonly Rarity[] = [
  { id: 1, name: 'Common',    tier_order: 1, color_hex: '#9ca3af' },
  { id: 2, name: 'Rare',      tier_order: 2, color_hex: '#3b82f6' },
  { id: 3, name: 'Epic',      tier_order: 3, color_hex: '#a855f7' },
  { id: 4, name: 'Legendary', tier_order: 4, color_hex: '#f59e0b' },
  { id: 5, name: 'Mythic',    tier_order: 5, color_hex: '#ef4444' },
] as const;

export const rarityById = (id: number) => rarities.find((r) => r.id === id);
```

- [ ] **Step 2: Create `shared/data/mutations.ts`**

Write:
```ts
import type { Mutation } from '@/shared/types';

// PLACEHOLDER multipliers — Simon to provide real values.
export const mutations: readonly Mutation[] = [
  { id: 1, name: 'gold',         multiplier: 2,    color_hex: '#facc15', tier_order: 1 },
  { id: 2, name: 'diamond',      multiplier: 3,    color_hex: '#22d3ee', tier_order: 2 },
  { id: 3, name: 'plasma',       multiplier: 4,    color_hex: '#ec4899', tier_order: 3 },
  { id: 4, name: 'molten',       multiplier: 5,    color_hex: '#f97316', tier_order: 4 },
  { id: 5, name: 'radioactive',  multiplier: 6,    color_hex: '#84cc16', tier_order: 5 },
  { id: 6, name: 'shadow',       multiplier: 7,    color_hex: '#1f2937', tier_order: 6 },
  { id: 7, name: 'electrified',  multiplier: 8,    color_hex: '#fde047', tier_order: 7 },
  { id: 8, name: 'rainbow',      multiplier: 10,   color_hex: '#a78bfa', tier_order: 8 },
  { id: 9, name: 'void',         multiplier: 15,   color_hex: '#6b21a8', tier_order: 9 },
] as const;

export const mutationById = (id: number) => mutations.find((m) => m.id === id);
export const bestMutation = mutations.reduce(
  (best, m) => (m.multiplier > best.multiplier ? m : best),
  mutations[0],
);
```

- [ ] **Step 3: Create `shared/data/brainrots.ts`**

Write:
```ts
import type { Brainrot } from '@/shared/types';

// PLACEHOLDER catalogue. Simon to populate with real game data.
// Add entries as: { id, name, rarity_id, base_money_per_sec, level_growth_factor }.
export const brainrots: readonly Brainrot[] = [
  { id: 1, name: 'Sample Common Brainrot',   rarity_id: 1, base_money_per_sec: 1,   level_growth_factor: 1.05 },
  { id: 2, name: 'Sample Rare Brainrot',     rarity_id: 2, base_money_per_sec: 5,   level_growth_factor: 1.05 },
  { id: 3, name: 'Sample Epic Brainrot',     rarity_id: 3, base_money_per_sec: 25,  level_growth_factor: 1.05 },
  { id: 4, name: 'Sample Legendary',         rarity_id: 4, base_money_per_sec: 100, level_growth_factor: 1.05 },
] as const;

export const brainrotById = (id: number) => brainrots.find((b) => b.id === id);
```

- [ ] **Step 4: Commit**

```bash
git add shared/data/
git commit -m "feat: add catalog data scaffolding (placeholder)"
```

---

## Task 6: Calculations + format utilities (TDD)

**Files:**
- Create: `shared/utils/calculations.ts`, `shared/utils/format.ts`, `tests/calculations.test.ts`, `tests/format.test.ts`

- [ ] **Step 1: Write failing tests for `getMoneyPerSecAtLevel`**

Create `tests/calculations.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  getMoneyPerSecAtLevel,
  currentMoneyPerSec,
  totalIncome,
  maxPotential,
} from '@/shared/utils/calculations';
import type { Brainrot, UserBrainrot } from '@/shared/types';

const sampleBrainrot: Brainrot = {
  id: 1,
  name: 'Test',
  rarity_id: 1,
  base_money_per_sec: 10,
  level_growth_factor: 1.1,
};

describe('getMoneyPerSecAtLevel', () => {
  it('returns base value at level 1', () => {
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 1)).toBeCloseTo(10);
  });

  it('applies geometric growth', () => {
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 2)).toBeCloseTo(11);
    expect(getMoneyPerSecAtLevel(sampleBrainrot, 3)).toBeCloseTo(12.1);
  });

  it('throws on out-of-range level', () => {
    expect(() => getMoneyPerSecAtLevel(sampleBrainrot, 0)).toThrow();
    expect(() => getMoneyPerSecAtLevel(sampleBrainrot, 76)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
pnpm test
```
Expected: FAIL — module `@/shared/utils/calculations` does not exist.

- [ ] **Step 3: Implement `getMoneyPerSecAtLevel`**

Create `shared/utils/calculations.ts`:
```ts
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';

export const MAX_LEVEL = 75;

export function getMoneyPerSecAtLevel(brainrot: Brainrot, level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > MAX_LEVEL) {
    throw new Error(`level must be an integer between 1 and ${MAX_LEVEL}, got ${level}`);
  }
  return brainrot.base_money_per_sec * Math.pow(brainrot.level_growth_factor, level - 1);
}

export function currentMoneyPerSec(
  brainrot: Brainrot,
  level: number,
  mutation: Mutation | null,
): number {
  const base = getMoneyPerSecAtLevel(brainrot, level);
  return mutation ? base * mutation.multiplier : base;
}

export function totalIncome(
  base: UserBrainrot[],
  catalog: { brainrots: readonly Brainrot[]; mutations: readonly Mutation[] },
): number {
  return base.reduce((sum, ub) => {
    const brainrot = catalog.brainrots.find((b) => b.id === ub.brainrot_id);
    if (!brainrot) return sum;
    const mutation =
      ub.mutation_id != null
        ? catalog.mutations.find((m) => m.id === ub.mutation_id) ?? null
        : null;
    return sum + currentMoneyPerSec(brainrot, ub.level, mutation);
  }, 0);
}

export function maxPotential(
  brainrot: Brainrot,
  bestMutation: Mutation,
): number {
  return currentMoneyPerSec(brainrot, MAX_LEVEL, bestMutation);
}
```

- [ ] **Step 4: Run tests to verify `getMoneyPerSecAtLevel` passes**

Run:
```bash
pnpm test
```
Expected: 3 tests pass.

- [ ] **Step 5: Add tests for `currentMoneyPerSec`**

Append to `tests/calculations.test.ts`:
```ts
const sampleMutation = {
  id: 1,
  name: 'gold',
  multiplier: 2,
  color_hex: '#000',
  tier_order: 1,
};

describe('currentMoneyPerSec', () => {
  it('equals getMoneyPerSecAtLevel when no mutation', () => {
    expect(currentMoneyPerSec(sampleBrainrot, 5, null)).toBeCloseTo(
      getMoneyPerSecAtLevel(sampleBrainrot, 5),
    );
  });

  it('multiplies by mutation when present', () => {
    const base = getMoneyPerSecAtLevel(sampleBrainrot, 5);
    expect(currentMoneyPerSec(sampleBrainrot, 5, sampleMutation)).toBeCloseTo(base * 2);
  });
});
```

- [ ] **Step 6: Run tests**

Run:
```bash
pnpm test
```
Expected: 5 tests pass.

- [ ] **Step 7: Add tests for `totalIncome`**

Append:
```ts
describe('totalIncome', () => {
  const catalog = {
    brainrots: [sampleBrainrot],
    mutations: [sampleMutation],
  };

  it('returns 0 for empty base', () => {
    expect(totalIncome([], catalog)).toBe(0);
  });

  it('sums income across the base', () => {
    const base: UserBrainrot[] = [
      { id: 'a', brainrot_id: 1, mutation_id: null,  level: 1, created_at: '', updated_at: '' },
      { id: 'b', brainrot_id: 1, mutation_id: 1,     level: 1, created_at: '', updated_at: '' },
    ];
    expect(totalIncome(base, catalog)).toBeCloseTo(10 + 20);
  });

  it('skips entries whose brainrot is not in the catalog', () => {
    const base: UserBrainrot[] = [
      { id: 'a', brainrot_id: 999, mutation_id: null, level: 1, created_at: '', updated_at: '' },
    ];
    expect(totalIncome(base, catalog)).toBe(0);
  });
});
```

- [ ] **Step 8: Add tests for `maxPotential`**

Append:
```ts
describe('maxPotential', () => {
  it('uses MAX_LEVEL and best mutation', () => {
    const expected = sampleBrainrot.base_money_per_sec
      * Math.pow(sampleBrainrot.level_growth_factor, 74)
      * sampleMutation.multiplier;
    expect(maxPotential(sampleBrainrot, sampleMutation)).toBeCloseTo(expected);
  });
});
```

- [ ] **Step 9: Run all tests**

Run:
```bash
pnpm test
```
Expected: 9 tests pass.

- [ ] **Step 10: Write tests for `formatNumber`**

Create `tests/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatNumber } from '@/shared/utils/format';

describe('formatNumber', () => {
  it('returns plain digits below 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(42)).toBe('42');
    expect(formatNumber(999)).toBe('999');
  });

  it('uses k for thousands', () => {
    expect(formatNumber(1_000)).toBe('1.0k');
    expect(formatNumber(12_500)).toBe('12.5k');
  });

  it('uses M for millions', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('uses B for billions', () => {
    expect(formatNumber(7_300_000_000)).toBe('7.3B');
  });
});
```

- [ ] **Step 11: Run test to verify failure**

Run:
```bash
pnpm test
```
Expected: FAIL on `format.test.ts` (module missing).

- [ ] **Step 12: Implement `formatNumber`**

Create `shared/utils/format.ts`:
```ts
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  if (abs < 1_000) return Math.round(n).toString();
  if (abs < 1_000_000) return (n / 1_000).toFixed(1) + 'k';
  if (abs < 1_000_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs < 1_000_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  return (n / 1_000_000_000_000).toFixed(1) + 'T';
}
```

- [ ] **Step 13: Run all tests**

Run:
```bash
pnpm test
```
Expected: all tests pass (13 total).

- [ ] **Step 14: Commit**

```bash
git add shared/utils/ tests/calculations.test.ts tests/format.test.ts
git commit -m "feat: add calculations and format utilities (TDD)"
```

---

## Task 7: KV service (TDD with mocked Redis)

**Files:**
- Create: `server/lib/kv.ts`, `server/services/base.ts`, `tests/base-service.test.ts`

- [ ] **Step 1: Write failing tests for base service**

Create `tests/base-service.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so the mock factory below can reference these.
const { mockRedis } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// `server-only` throws when imported outside a server build; stub it for tests.
vi.mock('server-only', () => ({}));

vi.mock('@/server/lib/kv', () => ({
  redis: mockRedis,
  BASE_KEY: 'kicktrack:base',
}));

import {
  getBase,
  addBrainrot,
  updateBrainrot,
  deleteBrainrot,
  replaceBase,
} from '@/server/services/base';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBase', () => {
  it('returns empty array when KV has no entry', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    expect(await getBase()).toEqual([]);
  });

  it('returns parsed array when KV has data', async () => {
    const sample = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
    ];
    mockRedis.get.mockResolvedValueOnce(sample);
    expect(await getBase()).toEqual(sample);
  });
});

describe('addBrainrot', () => {
  it('appends a new entry with generated id and timestamps', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    mockRedis.set.mockResolvedValueOnce('OK');

    const result = await addBrainrot({ brainrot_id: 1, mutation_id: null, level: 5 });

    expect(result.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.created_at).toBeTruthy();
    expect(result.updated_at).toBeTruthy();
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', [result]);
  });

  it('throws when input is invalid', async () => {
    await expect(addBrainrot({ brainrot_id: 1, mutation_id: null, level: 999 } as any))
      .rejects.toThrow();
  });
});

describe('updateBrainrot', () => {
  it('updates the matching entry and bumps updated_at', async () => {
    const existing = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: 'old', updated_at: 'old' },
    ];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');

    const updated = await updateBrainrot('a', { level: 10 });
    expect(updated?.level).toBe(10);
    expect(updated?.updated_at).not.toBe('old');
  });

  it('returns null when entry not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await updateBrainrot('nope', { level: 10 })).toBeNull();
  });
});

describe('deleteBrainrot', () => {
  it('removes the entry by id', async () => {
    const existing = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: 'x', updated_at: 'x' },
      { id: 'b', brainrot_id: 2, mutation_id: null, level: 5, created_at: 'x', updated_at: 'x' },
    ];
    mockRedis.get.mockResolvedValueOnce(existing);
    mockRedis.set.mockResolvedValueOnce('OK');

    const ok = await deleteBrainrot('a');
    expect(ok).toBe(true);
    expect(mockRedis.set).toHaveBeenCalledWith(
      'kicktrack:base',
      [existing[1]],
    );
  });

  it('returns false when id not found', async () => {
    mockRedis.get.mockResolvedValueOnce([]);
    expect(await deleteBrainrot('nope')).toBe(false);
  });
});

describe('replaceBase', () => {
  it('writes the validated array', async () => {
    const incoming = [
      { id: 'a', brainrot_id: 1, mutation_id: null, level: 5, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' },
    ];
    mockRedis.set.mockResolvedValueOnce('OK');
    await replaceBase(incoming as any);
    expect(mockRedis.set).toHaveBeenCalledWith('kicktrack:base', incoming);
  });

  it('rejects invalid arrays', async () => {
    await expect(replaceBase([{ bogus: true }] as any)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify failures**

Run:
```bash
pnpm test
```
Expected: FAIL (modules missing).

- [ ] **Step 3: Implement KV client**

Create `server/lib/kv.ts`:
```ts
import 'server-only';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const BASE_KEY = 'kicktrack:base';
```

- [ ] **Step 4: Implement base service**

Create `server/services/base.ts`:
```ts
import 'server-only';
import { v4 as uuidv4 } from 'uuid';
import { redis, BASE_KEY } from '@/server/lib/kv';
import {
  userBrainrotInputSchema,
  userBrainrotArraySchema,
  type UserBrainrotInput,
} from '@/shared/schemas/user-brainrot';
import type { UserBrainrot } from '@/shared/types';

export async function getBase(): Promise<UserBrainrot[]> {
  const raw = await redis.get<UserBrainrot[]>(BASE_KEY);
  return raw ?? [];
}

export async function addBrainrot(input: UserBrainrotInput): Promise<UserBrainrot> {
  const validated = userBrainrotInputSchema.parse(input);
  const now = new Date().toISOString();
  const entry: UserBrainrot = {
    id: uuidv4(),
    brainrot_id: validated.brainrot_id,
    mutation_id: validated.mutation_id,
    level: validated.level,
    nickname: validated.nickname,
    created_at: now,
    updated_at: now,
  };
  const base = await getBase();
  await redis.set(BASE_KEY, [...base, entry]);
  return entry;
}

export async function updateBrainrot(
  id: string,
  patch: Partial<UserBrainrotInput>,
): Promise<UserBrainrot | null> {
  const base = await getBase();
  const idx = base.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const merged = { ...base[idx], ...patch };
  const validated = userBrainrotInputSchema.parse({
    brainrot_id: merged.brainrot_id,
    mutation_id: merged.mutation_id,
    level: merged.level,
    nickname: merged.nickname,
  });
  const updated: UserBrainrot = {
    ...base[idx],
    ...validated,
    updated_at: new Date().toISOString(),
  };
  const next = [...base];
  next[idx] = updated;
  await redis.set(BASE_KEY, next);
  return updated;
}

export async function deleteBrainrot(id: string): Promise<boolean> {
  const base = await getBase();
  const next = base.filter((b) => b.id !== id);
  if (next.length === base.length) return false;
  await redis.set(BASE_KEY, next);
  return true;
}

export async function replaceBase(incoming: UserBrainrot[]): Promise<void> {
  const validated = userBrainrotArraySchema.parse(incoming);
  await redis.set(BASE_KEY, validated);
}
```

- [ ] **Step 5: Install `server-only` package**

Run:
```bash
pnpm add server-only
```

- [ ] **Step 6: Run tests**

Run:
```bash
pnpm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add server/ tests/base-service.test.ts package.json pnpm-lock.yaml
git commit -m "feat: add KV-backed base service with TDD"
```

---

## Task 8: App layout, globals, navigation

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `components/Nav.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

Write:
```tsx
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'KickTrack',
  description: 'Personal Kick a Lucky Block base tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl p-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `components/Nav.tsx`**

Write:
```tsx
import Link from 'next/link';

export function Nav() {
  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-6 p-4">
        <Link href="/" className="font-bold text-lg">KickTrack</Link>
        <Link href="/" className="text-sm hover:underline">Dashboard</Link>
        <Link href="/add" className="text-sm hover:underline">Add</Link>
        <Link href="/catalog" className="text-sm hover:underline">Catalog</Link>
        <Link href="/settings" className="ml-auto text-sm hover:underline">Settings</Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
pnpm build
```
Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add app/ components/Nav.tsx
git commit -m "feat: add layout and navigation"
```

---

## Task 9: Dashboard page

**Files:**
- Modify: `app/page.tsx`
- Create: `components/stats/StatsHeader.tsx`, `components/brainrot/BrainrotCard.tsx`

- [ ] **Step 1: Create `components/stats/StatsHeader.tsx`**

Write:
```tsx
import { formatNumber } from '@/shared/utils/format';

type Props = {
  totalIncomePerSec: number;
  count: number;
};

export function StatsHeader({ totalIncomePerSec, count }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-8">
      <div className="rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">Total income / sec</div>
        <div className="text-4xl font-bold">{formatNumber(totalIncomePerSec)}</div>
      </div>
      <div className="rounded-xl border border-border p-6">
        <div className="text-sm text-muted-foreground">Brainrots in base</div>
        <div className="text-4xl font-bold">{count}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/brainrot/BrainrotCard.tsx`**

Write:
```tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/shared/utils/format';
import type { Brainrot, Mutation, Rarity, UserBrainrot } from '@/shared/types';
import { currentMoneyPerSec } from '@/shared/utils/calculations';

type Props = {
  user: UserBrainrot;
  brainrot: Brainrot;
  rarity?: Rarity;
  mutation: Mutation | null;
};

export function BrainrotCard({ user, brainrot, rarity, mutation }: Props) {
  const income = currentMoneyPerSec(brainrot, user.level, mutation);
  return (
    <Link
      href={`/brainrot/${user.id}`}
      className="rounded-xl border border-border p-4 transition hover:bg-accent"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{user.nickname || brainrot.name}</div>
          {user.nickname && (
            <div className="text-xs text-muted-foreground">{brainrot.name}</div>
          )}
        </div>
        {rarity && (
          <Badge style={{ backgroundColor: rarity.color_hex }}>{rarity.name}</Badge>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
        <span>Lvl {user.level}</span>
        {mutation && (
          <span style={{ color: mutation.color_hex }}>{mutation.name} ×{mutation.multiplier}</span>
        )}
      </div>
      <div className="mt-2 font-mono text-lg">{formatNumber(income)}/s</div>
    </Link>
  );
}
```

- [ ] **Step 3: Replace `app/page.tsx` with the dashboard**

Write:
```tsx
import { getBase } from '@/server/services/base';
import { brainrots, brainrotById } from '@/shared/data/brainrots';
import { mutations, mutationById } from '@/shared/data/mutations';
import { rarityById } from '@/shared/data/rarities';
import { totalIncome } from '@/shared/utils/calculations';
import { StatsHeader } from '@/components/stats/StatsHeader';
import { BrainrotCard } from '@/components/brainrot/BrainrotCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const base = await getBase();
  const total = totalIncome(base, { brainrots, mutations });

  return (
    <>
      <StatsHeader totalIncomePerSec={total} count={base.length} />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your base</h2>
        <Link href="/add">
          <Button>Add brainrot</Button>
        </Link>
      </div>

      {base.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Your base is empty. <Link href="/add" className="underline">Add your first brainrot</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {base.map((user) => {
            const brainrot = brainrotById(user.brainrot_id);
            if (!brainrot) return null;
            const rarity = rarityById(brainrot.rarity_id);
            const mutation =
              user.mutation_id != null ? mutationById(user.mutation_id) ?? null : null;
            return (
              <BrainrotCard
                key={user.id}
                user={user}
                brainrot={brainrot}
                rarity={rarity}
                mutation={mutation}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/
git commit -m "feat: add dashboard page"
```

---

## Task 10: Add brainrot page

**Files:**
- Create: `app/add/page.tsx`, `app/add/actions.ts`, `components/brainrot/AddBrainrotForm.tsx`

- [ ] **Step 1: Create the Server Action**

Create `app/add/actions.ts`:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addBrainrot } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';

export async function createBrainrotAction(formData: FormData) {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id: formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
      ? null
      : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  await addBrainrot(input);
  revalidatePath('/');
  redirect('/');
}
```

- [ ] **Step 2: Create the form component**

Create `components/brainrot/AddBrainrotForm.tsx`:
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Brainrot, Mutation } from '@/shared/types';
import { createBrainrotAction } from '@/app/add/actions';

type Props = {
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function AddBrainrotForm({ brainrots, mutations }: Props) {
  return (
    <form action={createBrainrotAction} className="grid gap-4 max-w-md">
      <div>
        <Label htmlFor="brainrot_id">Brainrot</Label>
        <Select name="brainrot_id" required>
          <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
          <SelectContent>
            {brainrots.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="mutation_id">Mutation (optional)</Label>
        <Select name="mutation_id" defaultValue="null">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="null">None</SelectItem>
            {mutations.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name} ×{m.multiplier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="level">Level (1–75)</Label>
        <Input id="level" name="level" type="number" min={1} max={75} defaultValue={1} required />
      </div>

      <div>
        <Label htmlFor="nickname">Nickname (optional)</Label>
        <Input id="nickname" name="nickname" type="text" maxLength={50} />
      </div>

      <Button type="submit">Add to base</Button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

Create `app/add/page.tsx`:
```tsx
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { AddBrainrotForm } from '@/components/brainrot/AddBrainrotForm';

export default function AddPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add brainrot</h1>
      <AddBrainrotForm brainrots={brainrots} mutations={mutations} />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add app/add/ components/brainrot/AddBrainrotForm.tsx
git commit -m "feat: add brainrot creation page"
```

---

## Task 11: Edit / delete brainrot page

**Files:**
- Create: `app/brainrot/[id]/page.tsx`, `app/brainrot/[id]/actions.ts`, `components/brainrot/EditBrainrotForm.tsx`

- [ ] **Step 1: Create Server Actions**

Create `app/brainrot/[id]/actions.ts`:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateBrainrot, deleteBrainrot } from '@/server/services/base';
import { userBrainrotInputSchema } from '@/shared/schemas/user-brainrot';

export async function updateBrainrotAction(id: string, formData: FormData) {
  const input = userBrainrotInputSchema.parse({
    brainrot_id: Number(formData.get('brainrot_id')),
    mutation_id: formData.get('mutation_id') === '' || formData.get('mutation_id') === 'null'
      ? null
      : Number(formData.get('mutation_id')),
    level: Number(formData.get('level')),
    nickname: (formData.get('nickname') as string | null) || undefined,
  });
  await updateBrainrot(id, input);
  revalidatePath('/');
  redirect('/');
}

export async function deleteBrainrotAction(id: string) {
  await deleteBrainrot(id);
  revalidatePath('/');
  redirect('/');
}
```

- [ ] **Step 2: Create edit form**

Create `components/brainrot/EditBrainrotForm.tsx`:
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Brainrot, Mutation, UserBrainrot } from '@/shared/types';
import { updateBrainrotAction, deleteBrainrotAction } from '@/app/brainrot/[id]/actions';

type Props = {
  user: UserBrainrot;
  brainrots: readonly Brainrot[];
  mutations: readonly Mutation[];
};

export function EditBrainrotForm({ user, brainrots, mutations }: Props) {
  const update = updateBrainrotAction.bind(null, user.id);
  const remove = deleteBrainrotAction.bind(null, user.id);

  return (
    <div className="grid gap-6 max-w-md">
      <form action={update} className="grid gap-4">
        <div>
          <Label htmlFor="brainrot_id">Brainrot</Label>
          <Select name="brainrot_id" defaultValue={String(user.brainrot_id)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {brainrots.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="mutation_id">Mutation</Label>
          <Select
            name="mutation_id"
            defaultValue={user.mutation_id == null ? 'null' : String(user.mutation_id)}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null">None</SelectItem>
              {mutations.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name} ×{m.multiplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="level">Level</Label>
          <Input id="level" name="level" type="number" min={1} max={75} defaultValue={user.level} required />
        </div>

        <div>
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" name="nickname" type="text" maxLength={50} defaultValue={user.nickname || ''} />
        </div>

        <Button type="submit">Save</Button>
      </form>

      <form action={remove}>
        <Button type="submit" variant="destructive">Delete</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create the page**

Create `app/brainrot/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { getBase } from '@/server/services/base';
import { brainrots } from '@/shared/data/brainrots';
import { mutations } from '@/shared/data/mutations';
import { EditBrainrotForm } from '@/components/brainrot/EditBrainrotForm';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getBase();
  const user = base.find((b) => b.id === id);
  if (!user) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit brainrot</h1>
      <EditBrainrotForm user={user} brainrots={brainrots} mutations={mutations} />
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run:
```bash
pnpm build
```
Expected: build passes.

- [ ] **Step 5: Commit**

```bash
git add app/brainrot/ components/brainrot/EditBrainrotForm.tsx
git commit -m "feat: add edit/delete brainrot page"
```

---

## Task 12: Catalog page

**Files:**
- Create: `app/catalog/page.tsx`

- [ ] **Step 1: Create the catalog page**

Write `app/catalog/page.tsx`:
```tsx
import { brainrots } from '@/shared/data/brainrots';
import { rarities, rarityById } from '@/shared/data/rarities';
import { bestMutation } from '@/shared/data/mutations';
import { maxPotential } from '@/shared/utils/calculations';
import { formatNumber } from '@/shared/utils/format';
import { Badge } from '@/components/ui/badge';

export default function CatalogPage() {
  const sortedRarities = [...rarities].sort((a, b) => a.tier_order - b.tier_order);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catalog</h1>
      <p className="text-muted-foreground mb-6">
        Best mutation: <span className="font-mono">{bestMutation.name}</span> ×{bestMutation.multiplier}
      </p>

      <div className="space-y-8">
        {sortedRarities.map((rarity) => {
          const inRarity = brainrots.filter((b) => b.rarity_id === rarity.id);
          if (inRarity.length === 0) return null;
          return (
            <section key={rarity.id}>
              <h2 className="text-xl font-semibold mb-3" style={{ color: rarity.color_hex }}>
                {rarity.name}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {inRarity.map((b) => (
                  <div key={b.id} className="rounded-xl border border-border p-4">
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Base: {formatNumber(b.base_money_per_sec)}/s
                    </div>
                    <div className="text-sm mt-2 font-mono">
                      Max: {formatNumber(maxPotential(b, bestMutation))}/s
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
pnpm build
```
Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add app/catalog/
git commit -m "feat: add catalog page"
```

---

## Task 13: Settings page (Export / Import)

**Files:**
- Create: `app/settings/page.tsx`, `app/settings/actions.ts`, `components/settings/ImportForm.tsx`

- [ ] **Step 1: Create Server Actions**

Create `app/settings/actions.ts`:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { getBase, replaceBase } from '@/server/services/base';
import { userBrainrotArraySchema } from '@/shared/schemas/user-brainrot';

export async function exportBaseAction(): Promise<string> {
  const base = await getBase();
  return JSON.stringify(base, null, 2);
}

export async function importBaseAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'No file provided' };
  if (file.size > 1024 * 1024) return { ok: false, error: 'File too large (max 1MB)' };

  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }

  const result = userBrainrotArraySchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: 'JSON does not match expected shape' };
  }

  await replaceBase(result.data);
  revalidatePath('/');
  return { ok: true };
}
```

- [ ] **Step 2: Create import form**

Create `components/settings/ImportForm.tsx`:
```tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { importBaseAction, exportBaseAction } from '@/app/settings/actions';

export function ImportForm() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleExport() {
    start(async () => {
      const json = await exportBaseAction();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kicktrack-base-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleImport(formData: FormData) {
    start(async () => {
      const res = await importBaseAction(formData);
      setMessage(res.ok ? 'Imported.' : `Error: ${res.error}`);
    });
  }

  return (
    <div className="grid gap-6 max-w-md">
      <section>
        <h2 className="font-semibold mb-2">Export</h2>
        <Button onClick={handleExport} disabled={pending}>Download base as JSON</Button>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Import</h2>
        <form action={handleImport} className="grid gap-3">
          <Input type="file" name="file" accept="application/json" required />
          <Button type="submit" disabled={pending}>Import (replaces current base)</Button>
        </form>
        {message && <p className="text-sm mt-2">{message}</p>}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Create the page**

Create `app/settings/page.tsx`:
```tsx
import { ImportForm } from '@/components/settings/ImportForm';

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <ImportForm />
    </div>
  );
}
```

- [ ] **Step 4: Verify build and tests**

Run:
```bash
pnpm build
pnpm test
```
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add app/settings/ components/settings/
git commit -m "feat: add settings page with export/import"
```

---

## Task 14: Deploy to Vercel + provision Vercel KV

**Files:**
- Modify: `README.md`, `.env.example`

- [ ] **Step 1: Write README**

Write `README.md`:
```markdown
# KickTrack

Personal Roblox "Kick a Lucky Block" base tracker. Solo, no auth, hosted on Vercel.

## Local dev
```bash
pnpm install
cp .env.example .env.local   # fill KV_REST_API_URL and KV_REST_API_TOKEN
pnpm dev
```

## Tests
```bash
pnpm test
```

## Deploy
1. Push to GitHub.
2. On Vercel, "New Project" → import the repo.
3. In project Storage tab: Create → Upstash for Redis (or Vercel KV). Connect.
4. The `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars are auto-populated.
5. Deploy.

## Tech
Next.js 15, TypeScript, Tailwind, shadcn/ui, Zod, @upstash/redis.

## Catalog data
Edit files in `shared/data/` and commit. No DB migration needed.
```

- [ ] **Step 2: Final pre-push verification**

Run:
```bash
pnpm lint
pnpm test
pnpm build
```
Expected: all three pass.

- [ ] **Step 3: Push to GitHub**

Manual step (Simon does this):
1. Create empty repo `kicktrack` on GitHub (private).
2. Run:
   ```bash
   git remote add origin <repo-url>
   git push -u origin main
   ```

- [ ] **Step 4: Connect Vercel project**

Manual step (via Vercel dashboard):
1. New Project → import the `kicktrack` repo.
2. Framework: Next.js (auto-detected).
3. Don't deploy yet — first add storage.
4. Storage tab → Create → Upstash for Redis (or Vercel KV) → connect to project.
5. Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` appear in Project Settings → Environment Variables.
6. Trigger deploy.

- [ ] **Step 5: Verify deployed site**

Open the Vercel-provided URL. Check:
- Dashboard loads (empty base message).
- `/add` page renders the form.
- Adding a brainrot works (KV write).
- `/catalog` lists placeholder brainrots.
- `/settings` lets you export/import.

- [ ] **Step 6: Append to `docs/decisions.md`**

Append:
```markdown

## 2026-05-03 — Simon (suite)
- V1 shippée. Stack confirmée : Next 15 + @upstash/redis + Tailwind + shadcn.
- Catalogue scaffold avec placeholders. À remplir avec données réelles du jeu.
- Open : confirmer si mutations cumulables + formule de level exacte (impacte `getMoneyPerSecAtLevel`).
```

- [ ] **Step 7: Commit and push**

```bash
git add README.md docs/decisions.md
git commit -m "docs: add README + decisions update for V1 ship"
git push
```

---

## Post-V1 follow-ups (not part of this plan)

- Fill `shared/data/brainrots.ts` with real data from the game.
- Confirm mutation cumulability — if cumulable, refactor `mutation_id` → `mutation_ids: number[]`.
- Confirm level progression formula — if not geometric, swap `getMoneyPerSecAtLevel` to a table lookup.
- Optional polish: search/filter on dashboard, sort options, level slider in forms.
