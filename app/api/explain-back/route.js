import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { explainBackPrompt } from "@/lib/prompts";
import { checkAndCount, isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { concept, question, explanation } = await req.json();
  if (!explanation || explanation.trim().length < 10) {
    return NextResponse.json({ error: "Write a bit more — a sentence or two." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const premium = isPremium(profile);

  const usageCheck = await checkAndCount(admin, user.id, "explain_back", premium);
  if (!usageCheck.ok) {
    return NextResponse.json({ error: "You've used today's free checks. Upgrade for unlimited." }, { status: 429 });
  }

  const raw = await ai(explainBackPrompt(concept || "", question || "", explanation), { tier: "fast", json: true });
  const result = parseJsonLoose(raw);
  return NextResponse.json({ result });
}
