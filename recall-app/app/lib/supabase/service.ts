import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return client;
}

/**
 * Lazy service-role Supabase client.
 *
 * Exposed as a Proxy so `createClient` is not called until the first property
 * access (i.e. at request time). Instantiating the client at module scope makes
 * Next.js's build-time "collect configuration" pass evaluate `createClient` with
 * env vars that may be absent, throwing "supabaseUrl is required" and failing the
 * production build. The proxy defers that call past module evaluation.
 */
export const supabaseService: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = (c as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(c) : value;
  },
});
