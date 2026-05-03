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
