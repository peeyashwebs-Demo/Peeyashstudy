import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { defenseEvaluatePrompt } from "@/lib/prompts";
import { isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (!isPremium(profile)) {
    return NextResponse.json({ error: "Premium feature." }, { status: 403 });
  }

  const { assignmentText, draft, qaPairs } = await req.json();
  if (!qaPairs?.length) return NextResponse.json({ error: "No answers received." }, { status: 400 });

  const raw = await ai(defenseEvaluatePrompt(assignmentText || "", draft || "", qaPairs), { tier: "quality", json: true });
  const evaluation = parseJsonLoose(raw);
  return NextResponse.json({ evaluation });
}
