import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { workedExamplePrompt } from "@/lib/prompts";
import { checkAndCount, isPremium } from "@/lib/usage";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { cacheKey } = await req.json();
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const premium = isPremium(profile);

  const usageCheck = await checkAndCount(admin, user.id, "worked_example", premium);
  if (!usageCheck.ok) {
    return NextResponse.json(
      { error: `Free plan allows ${usageCheck.limit} worked examples a month. Upgrade for unlimited.` },
      { status: 429 }
    );
  }

  const { data: doc } = await admin.from("document_cache").select("*").eq("cache_key", cacheKey).single();
  if (!doc) return NextResponse.json({ error: "Upload the assignment first." }, { status: 404 });

  let workedExample = doc.worked_example;
  if (!workedExample) {
    const raw = await ai(workedExamplePrompt(doc.breakdown, doc.extracted_text || ""), { tier: "quality", json: true });
    workedExample = parseJsonLoose(raw);
    await admin.from("document_cache").update({ worked_example: workedExample }).eq("cache_key", cacheKey);
  }

  return NextResponse.json({ workedExample });
}
