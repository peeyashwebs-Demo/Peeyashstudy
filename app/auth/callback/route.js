import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase sends the user here after they click the confirmation link in their email.
// We exchange the one-time code for a session, then send them to a clean login page
// with a "confirmed" flag so it can show a friendly success message.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    // Sign out immediately — we want them to land on a clean login screen and log in
    // deliberately, not get silently auto-logged-in straight to the dashboard.
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/login?confirmed=true`);
}
