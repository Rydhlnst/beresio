import { hc } from 'hono/client';
import type { Hono } from 'hono';
import type { AppType } from '@beresio/backend';

type Assert<T extends true> = T;
type _AppTypeMustBeHono = Assert<AppType extends Hono<any, any, any> ? true : false>;

type RpcMethod = (
  args?: unknown,
  options?: { headers?: HeadersInit; [key: string]: unknown }
) => Promise<Response>;

type RpcNode = {
  [key: string]: any;
  $get: RpcMethod;
  $post: RpcMethod;
  $put: RpcMethod;
  $patch: RpcMethod;
  $delete: RpcMethod;
  $url: (args?: unknown) => URL;
  $path: (args?: unknown) => string;
};

type RpcClient = {
  api: RpcNode;
};

const rawClient = hc<AppType>(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787');

export const apiClient = rawClient as RpcClient;
