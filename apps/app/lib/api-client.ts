import { hc } from 'hono/client';
import type { AppType } from '@beresio/backend';

export const apiClient = hc<AppType>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787');
