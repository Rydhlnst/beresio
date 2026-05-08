import { hc } from 'hono/client';
import type { AppType } from '@beresio/backend';
import { getSafeApiBaseUrl } from './safe-api-url';

// NOTE: `hc<AppType>` should yield a typed client, but the current monorepo TS setup
// sometimes collapses this to `unknown` during Next.js typechecking.
export const apiClient = hc<AppType>(getSafeApiBaseUrl()) as any;
