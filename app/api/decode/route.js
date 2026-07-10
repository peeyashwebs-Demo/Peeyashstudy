import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { decodePrompt } from "@/lib/prompts";
import { hashText } from "@/lib/hash";
import { checkAndCount, isPremium } from "@/lib/usage";
import { assessExtractionQuality, QUALITY_ERROR_MESSAGES } from "@/lib/textQuality";

// Text extraction kept dependency-light: pdf-parse on the server.
async function extractText(buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const premium = isPremium(profile);

  const usageCheck = await checkAndCount(admin, user.id, "uploads", premium);
  if (!usageCheck.ok) {
    return NextResponse.json(
      { error: `Free plan allows ${usageCheck.limit} uploads a month. You've used them all — upgrade to Premium for unlimited.` },
      { status: 429 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const rawText = formData.get("rawText");

  let text;
  let sourceName;
  let isTyped = false;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      text = await extractText(buffer);
    } catch {
      return NextResponse.json({ error: "Couldn't read that PDF. Try a text-based PDF, not a scanned photo." }, { status: 400 });
    }
    sourceName = file.name;
  } else if (rawText && rawText.trim().length > 0) {
    text = rawText.trim();
    isTyped = true;
    sourceName = text.slice(0, 60).replace(/\s+/g, " ") + (text.length > 60 ? "…" : "");
  } else {
    return NextResponse.json({ error: "Upload a PDF or paste/type your assignment text." }, { status: 400 });
  }

  if (isTyped) {
    // Typed/pasted text is inherently clean — no OCR or extraction garbling risk.
    // Only check it isn't empty; skip the PDF-oriented heuristics (they'd wrongly
    // reject short-but-valid input like a single math equation).
    if (text.length < 8) {
      return NextResponse.json({ error: "That looks too short — paste or type the full question." }, { status: 400 });
    }
  } else {
    const quality = assessExtractionQuality(text);
    if (!quality.ok) {
      return NextResponse.json(
        { error: QUALITY_ERROR_MESSAGES[quality.reason] || "We couldn't read this PDF cleanly. Try re-uploading." },
        { status: 400 }
      );
    }
  }

  const cacheKey = hashText(text);

  // cache hit -> zero AI cost
  const { data: cached } = await admin.from("document_cache").select("*").eq("cache_key", cacheKey).maybeSingle();

  let breakdown;
  if (cached?.breakdown) {
    breakdown = cached.breakdown;
    await admin.from("document_cache").update({ hit_count: (cached.hit_count || 0) + 1 }).eq("cache_key", cacheKey);
  } else {
    const raw = await ai(decodePrompt(text), { tier: "quality", json: true });
    breakdown = parseJsonLoose(raw);
    await admin.from("document_cache").upsert({
      cache_key: cacheKey,
      course_code: breakdown.course_code || null,
      doc_type: "tma",
      extracted_text: text.slice(0, 30000),
      breakdown
    });
  }

  await admin.from("uploads").insert({
    user_id: user.id,
    cache_key: cacheKey,
    original_name: sourceName
  });

  return NextResponse.json({ cacheKey, breakdown });
}
