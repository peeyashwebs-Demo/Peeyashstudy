import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const REFERRAL_BONUS_KOBO = 150000; // ₦1,500

// Called when the user lands back on /dashboard?reference=xxx after Paystack checkout.
// This is a safety net: the webhook is the primary path, but webhooks can be delayed,
// misconfigured, or missed on free/test setups — this guarantees the user isn't stuck
// in limbo after paying. Fully idempotent: safe to call even if the webhook already ran.
export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: "No reference provided." }, { status: 400 });

  const admin = createAdminClient();

  // Already processed? (webhook beat us to it, or this is a repeat call)
  const { data: existing } = await admin.from("transactions").select("id").eq("reference", reference).maybeSingle();
  if (existing) {
    const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", user.id).single();
    return NextResponse.json({ ok: true, alreadyProcessed: true, profile });
  }

  // Ask Paystack directly whether this reference actually succeeded
  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
  });
  const verifyData = await verifyRes.json();

  if (!verifyData.status || verifyData.data?.status !== "success") {
    return NextResponse.json({ ok: false, error: "Payment not confirmed as successful yet." }, { status: 400 });
  }

  const { amount, metadata } = verifyData.data;
  if (metadata?.user_id !== user.id) {
    return NextResponse.json({ error: "Reference does not match logged-in user." }, { status: 403 });
  }

  // Activate premium — identical logic to the webhook, so whichever runs first wins cleanly
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await admin.from("profiles").update({ plan: "premium", plan_expires_at: expires.toISOString() }).eq("id", user.id);

  await admin.from("transactions").insert({
    user_id: user.id, type: "subscription_payment", amount_kobo: -amount, reference,
    meta: { note: "Premium subscription activated (verified via fallback check)" }
  });

  const { data: referral } = await admin
    .from("referrals").select("*").eq("referred_id", user.id).eq("status", "signed_up").maybeSingle();

  if (referral) {
    const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", referral.referrer_id).single();
    await admin.from("wallets").update({
      balance_kobo: (wallet?.balance_kobo || 0) + REFERRAL_BONUS_KOBO,
      updated_at: new Date().toISOString()
    }).eq("user_id", referral.referrer_id);

    await admin.from("transactions").insert({
      user_id: referral.referrer_id, type: "referral_bonus", amount_kobo: REFERRAL_BONUS_KOBO,
      reference, meta: { referred_id: user.id }
    });

    await admin.from("referrals").update({ status: "credited", credited_at: new Date().toISOString() }).eq("id", referral.id);
  }

  return NextResponse.json({ ok: true, plan: "premium", plan_expires_at: expires.toISOString() });
}
