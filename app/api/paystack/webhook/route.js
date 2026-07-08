import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webpush";

const REFERRAL_BONUS_KOBO = 150000; // ₦1,500

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  const { metadata, reference, amount } = event.data;
  const userId = metadata?.user_id;
  if (!userId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();

  // idempotency: skip if we've already recorded this reference
  const { data: existing } = await admin.from("transactions").select("id").eq("reference", reference).maybeSingle();
  if (existing) return NextResponse.json({ ok: true });

  // 1. activate premium for 30 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);
  await admin.from("profiles").update({ plan: "premium", plan_expires_at: expires.toISOString() }).eq("id", userId);

  await admin.from("transactions").insert({
    user_id: userId, type: "subscription_payment", amount_kobo: -amount, reference,
    meta: { note: "Premium subscription activated" }
  });

  // 2. credit referrer ONLY on this user's first successful payment
  const { data: referral } = await admin
    .from("referrals").select("*").eq("referred_id", userId).eq("status", "signed_up").maybeSingle();

  if (referral) {
    // safe increment via read-modify-write (fine at this scale; move to a DB function at higher volume)
    const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", referral.referrer_id).single();
    await admin.from("wallets").update({
      balance_kobo: (wallet?.balance_kobo || 0) + REFERRAL_BONUS_KOBO,
      updated_at: new Date().toISOString()
    }).eq("user_id", referral.referrer_id);

    await admin.from("transactions").insert({
      user_id: referral.referrer_id, type: "referral_bonus", amount_kobo: REFERRAL_BONUS_KOBO,
      reference, meta: { referred_id: userId }
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
