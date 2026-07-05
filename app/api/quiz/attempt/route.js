import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { cacheKey, score, total } = await req.json();
  const admin = createAdminClient();
  await admin.from("quiz_attempts").insert({ user_id: user.id, cache_key: cacheKey, score, total });
  return NextResponse.json({ ok: true });
}
