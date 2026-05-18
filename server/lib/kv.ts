import 'server-only';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const SIMON_SLUG = 'swym0wnrz5';

export const baseKey = (slug: string) => `kicktrack:${slug}:base`;
export const tradeKey = (slug: string) => `kicktrack:${slug}:trade`;
export const tradeLogKey = (slug: string) => `kicktrack:${slug}:trade:log`;

// Legacy unprefixed keys — read once during migration, then deleted.
export const LEGACY_BASE_KEY = 'kicktrack:base';
export const LEGACY_TRADE_KEY = 'kicktrack:trade';
export const LEGACY_TRADE_LOG_KEY = 'kicktrack:trade:log';
