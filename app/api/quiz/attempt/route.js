import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const { cacheKey, score, total, perQuestion } = await req.json();
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from("quiz_attempts")
    .insert({ user_id: user.id, cache_key: cacheKey, score, total })
    .select()
    .single();

  if (Array.isArray(perQuestion) && perQuestion.length && attempt) {
    const rows = perQuestion.map((p) => ({
      attempt_id: attempt.id,
      user_id: user.id,
      concept: p.concept || "General",
      correct: !!p.correct
    }));
    await admin.from("quiz_answers").insert(rows);
  }

  return NextResponse.json({ ok: true });
}
