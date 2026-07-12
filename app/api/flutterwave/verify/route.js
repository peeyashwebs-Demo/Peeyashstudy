import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const REFERRAL_BONUS_NAIRA = 1500; // ₦1,500

// Called when the user lands back on /dashboard?checkout=1 after Flutterwave checkout.
// This is a safety net: the webhook is the primary path, but webhooks can be delayed,
// misconfigured, or missed on free/test setups — this guarantees the user isn't stuck
// in limbo after paying. Fully idempotent: safe to call even if the webhook already ran.
export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  // Flutterwave appends tx_ref (and transaction_id, status) to your redirect_url as
  // query params — send the tx_ref your frontend reads off the URL here.
  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: "No reference provided." }, { status: 400 });

  const admin = createAdminClient();

  // Already processed? (webhook beat us to it, or this is a repeat call)
  const { data: existing } = await admin.from("transactions").select("id").eq("reference", reference).maybeSingle();
  if (existing) {
    const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", user.id).single();
    return NextResponse.json({ ok: true, alreadyProcessed: true, profile });
  }

  // Ask Flutterwave directly whether this reference actually succeeded
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${reference}`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
  );
  const verifyData = await verifyRes.json();

  if (verifyData.status !== "success" || verifyData.data?.status !== "successful") {
    return NextResponse.json({ ok: false, error: "Payment not confirmed as successful yet." }, { status: 400 });
  }

  const { amount, meta } = verifyData.data;
  if (meta?.user_id !== user.id) {
    return NextResponse.json({ error: "Reference does not match logged-in user." }, { status: 403 });
  }

  // Activate premium — identical logic to the webhook, so whichever runs first wins cleanly
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await admin.from("profiles").update({ plan: "premium", plan_expires_at: expires.toISOString() }).eq("id", user.id);

  await admin.from("transactions").insert({
    user_id: user.id, type: "subscription_payment", amount_kobo: -(amount * 100), reference,
    meta: { note: "Premium subscription activated (verified via fallback check)" }
  });

  const { data: referral } = await admin
    .from("referrals").select("*").eq("referred_id", user.id).eq("status", "signed_up").maybeSingle();

  if (referral) {
    const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", referral.referrer_id).single();
    await admin.from("wallets").update({
      balance_kobo: (wallet?.balance_kobo || 0) + REFERRAL_BONUS_NAIRA * 100,
      updated_at: new Date().toISOString()
    }).eq("user_id", referral.referrer_id);

    await admin.from("transactions").insert({
      user_id: referral.referrer_id, type: "referral_bonus", amount_kobo: REFERRAL_BONUS_NAIRA * 100,
      reference, meta: { referred_id: user.id }
    });

    await admin.from("referrals").update({ status: "credited", credited_at: new Date().toISOString() }).eq("id", referral.id);
  }

  return NextResponse.json({ ok: true, plan: "premium", plan_expires_at: expires.toISOString() });
}
