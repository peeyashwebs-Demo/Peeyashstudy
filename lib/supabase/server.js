import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createBase } from "@supabase/supabase-js";

// For server components & route handlers (acts as the logged-in user)
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        }
      }
    }
  );
}

// Service role: bypasses RLS. SERVER ONLY. Used for wallets, cache, usage, webhooks.
export function createAdminClient() {
  return createBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
