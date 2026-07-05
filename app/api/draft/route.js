import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { draftPrompt } from "@/lib/prompts";
import { isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  if (!isPremium(profile)) {
    return NextResponse.json({ error: "Draft Review is a Premium feature. Upgrade or earn it free with 5 referrals." }, { status: 403 });
  }

  const { assignmentText, draft } = await req.json();
  if (!draft || draft.trim().length < 30) {
    return NextResponse.json({ error: "Paste a bit more of your draft — at least a few sentences." }, { status: 400 });
  }

  const raw = await ai(draftPrompt(assignmentText || "", draft), { tier: "quality", json: true });
  const feedback = parseJsonLoose(raw);
  return NextResponse.json({ feedback });
}
