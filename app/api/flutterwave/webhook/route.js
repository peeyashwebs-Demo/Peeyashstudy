import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webpush";

const REFERRAL_BONUS_NAIRA = 1500; // ₦1,500

export async function POST(req) {
  // Flutterwave signs webhooks with a plain secret-hash string you set in the
  // Flutterwave dashboard (Settings → Webhooks) — NOT an HMAC like Paystack.
  // Store that same value as FLUTTERWAVE_SECRET_HASH in your env vars.
  const signature = req.headers.get("verif-hash");
  if (!signature || signature !== process.env.FLUTTERWAVE_SECRET_HASH) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json();
  if (event.event !== "charge.completed" || event.data?.status !== "successful") {
    return NextResponse.json({ ok: true });
  }

  const { meta, tx_ref, amount } = event.data;
  const userId = meta?.user_id;
  if (!userId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  // idempotency: skip if we've already recorded this reference
  const { data: existing } = await admin.from("transactions").select("id").eq("reference", tx_ref).maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  // 1. activate premium for 30 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await admin.from("profiles").update({ plan: "premium", plan_expires_at: expires.toISOString() }).eq("id", userId);

  await admin.from("transactions").insert({
    user_id: userId, type: "subscription_payment", amount_kobo: -(amount * 100), reference: tx_ref,
    meta: { note: "Premium subscription activated" }
  });

  // 2. credit referrer ONLY on this user's first successful payment
  const { data: referral } = await admin
    .from("referrals").select("*").eq("referred_id", userId).eq("status", "signed_up").maybeSingle();

  if (referral) {
    const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", referral.referrer_id).single();
    await admin.from("wallets").update({
      balance_kobo: (wallet?.balance_kobo || 0) + REFERRAL_BONUS_NAIRA * 100,
      updated_at: new Date().toISOString()
    }).eq("user_id", referral.referrer_id);

    await admin.from("transactions").insert({
      user_id: referral.referrer_id, type: "referral_bonus", amount_kobo: REFERRAL_BONUS_NAIRA * 100,
      reference: tx_ref, meta: { referred_id: userId }
    });

    await admin.from("referrals").update({ status: "credited", credited_at: new Date().toISOString() }).eq("id", referral.id);

    sendPushToUser(admin, referral.referrer_id, {
      title: "You just earned ₦1,500! 🎉",
      body: "Someone you invited just went Premium. Check your wallet.",
      url: "/wallet"
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
