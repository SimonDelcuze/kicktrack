import 'server-only';
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export const BASE_KEY = 'kicktrack:base';
export const TRADE_KEY = 'kicktrack:trade';
export const TRADE_LOG_KEY = 'kicktrack:trade:log';
