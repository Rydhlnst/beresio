import { hc } from 'hono/client';

// NOTE:
// We intentionally do not import the backend's `AppType` here.
// `@beresio/backend` currently points its `types` field to TypeScript source files,
// which causes Next.js/tsc in this app to type-check the entire backend project.
// That makes `next build` fail due to backend-internal type errors, even though the
// app only needs an HTTP client at runtime.
export const apiClient = hc(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787') as any;
