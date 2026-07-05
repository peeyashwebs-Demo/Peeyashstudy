import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai } from "@/lib/gemini";
import { chatPrompt } from "@/lib/prompts";
import { checkAndCount, isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { cacheKey, history, question } = await req.json();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const premium = isPremium(profile);

  const usageCheck = await checkAndCount(admin, user.id, "chat", premium);
  if (!usageCheck.ok) {
    return NextResponse.json({ error: "You've used today's free chat messages. Upgrade for unlimited." }, { status: 429 });
  }

  const { data: doc } = await admin.from("document_cache").select("extracted_text").eq("cache_key", cacheKey).single();
  if (!doc) return NextResponse.json({ error: "Upload the material first." }, { status: 404 });

  const answer = await ai(chatPrompt(doc.extracted_text, history || [], question), { tier: "fast" });
  return NextResponse.json({ answer });
}
