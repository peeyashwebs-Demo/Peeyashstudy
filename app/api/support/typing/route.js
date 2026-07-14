import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Lightweight endpoint hit on every keystroke (debounced client-side) — just
// stamps a timestamp so the other side's poll can show "typing…". No auth
// required for the "user" side since guests can chat too; the "admin" side
// checks ADMIN_EMAIL like the other admin routes.
export async function POST(req) {
  const { conversationId, as } = await req.json();
  if (!conversationId || !as) return NextResponse.json({ ok: false }, { status: 400 });

  if (as === "admin") {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
  }

  const admin = createAdminClient();
  const field = as === "admin" ? "admin_typing_at" : "user_typing_at";
  await admin.from("support_conversations").update({ [field]: new Date().toISOString() }).eq("id", conversationId);

  return NextResponse.json({ ok: true });
}
