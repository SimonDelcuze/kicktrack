# KickTrack

Personal Roblox "Kick a Lucky Block" base tracker. Solo, no auth, hosted on Vercel.

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill KV_REST_API_URL and KV_REST_API_TOKEN
pnpm dev
```

## Verification

```bash
pnpm test     # unit tests (calculations, base service, format)
pnpm lint     # ESLint
pnpm build    # production build (also typechecks)
```

## Deploy

1. Push to GitHub.
2. On Vercel, "New Project" → import the repo.
3. In project Storage tab: Create → Upstash for Redis (or Vercel KV). Connect to project.
4. The `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars are auto-populated.
5. Deploy.

## Tech

Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Zod, `@upstash/redis`, Vitest.

## Catalog data

Edit files in `shared/data/` (`rarities.ts`, `mutations.ts`, `brainrots.ts`) and commit. Changes deploy automatically on push.

## Architecture

- `app/` — UI (Server Components by default)
- `server/` — server-only services (`base.ts` = KV CRUD)
- `shared/` — types, Zod schemas, pure utils, catalog data
- `components/` — UI components (shadcn primitives in `ui/`)
- `tests/` — Vitest unit tests
