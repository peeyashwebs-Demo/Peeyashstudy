import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ].filter(Boolean).join(", ");
    throw new Error(
      `Supabase is not configured correctly. Missing env variable(s): ${missing}. Check Vercel → Settings → Environment Variables.`
    );
  }

  return createBrowserClient(url, anonKey);
}
