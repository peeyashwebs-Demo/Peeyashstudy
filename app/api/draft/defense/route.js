import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { defenseQuestionsPrompt } from "@/lib/prompts";
import { isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (!isPremium(profile)) {
    return NextResponse.json({ error: "The oral defense is a Premium feature. Upgrade or earn it free with 5 referrals." }, { status: 403 });
  }

  const { assignmentText, draft } = await req.json();
  if (!draft || draft.trim().length < 30) {
    return NextResponse.json({ error: "Paste your draft first." }, { status: 400 });
  }

  const raw = await ai(defenseQuestionsPrompt(assignmentText || "", draft), { tier: "fast", json: true });
  const { questions } = parseJsonLoose(raw);
  return NextResponse.json({ questions });
}
