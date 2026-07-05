import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { quizPrompt } from "@/lib/prompts";
import { checkAndCount, isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { cacheKey } = await req.json();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const premium = isPremium(profile);

  const usageCheck = await checkAndCount(admin, user.id, "quizzes", premium);
  if (!usageCheck.ok) {
    return NextResponse.json({ error: "You've used your free quizzes for this month. Upgrade for unlimited." }, { status: 429 });
  }

  const { data: doc } = await admin.from("document_cache").select("*").eq("cache_key", cacheKey).single();
  if (!doc) return NextResponse.json({ error: "Upload the document first." }, { status: 404 });

  let quiz = doc.quiz;
  if (!quiz) {
    const raw = await ai(quizPrompt(doc.extracted_text), { tier: "fast", json: true });
    quiz = parseJsonLoose(raw);
    await admin.from("document_cache").update({ quiz }).eq("cache_key", cacheKey);
  }
  return NextResponse.json({ quiz });
}
