import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const PREMIUM_COST_KOBO = 500000; // ₦5,000

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", user.id).single();

  if (!wallet || wallet.balance_kobo < PREMIUM_COST_KOBO) {
    return NextResponse.json({ error: "Your wallet balance isn't enough yet." }, { status: 400 });
  }

  // Debit the wallet
  await admin.from("wallets").update({
    balance_kobo: wallet.balance_kobo - PREMIUM_COST_KOBO,
    updated_at: new Date().toISOString()
  }).eq("user_id", user.id);

  // Extend premium by 30 days from today (or from current expiry if still active, so it stacks correctly)
  const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", user.id).single();
  const currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
  const base = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
  base.setDate(base.getDate() + 30);

  await admin.from("profiles").update({ plan: "premium", plan_expires_at: base.toISOString() }).eq("id", user.id);

  await admin.from("transactions").insert({
    user_id: user.id, type: "sub_renewal_from_wallet", amount_kobo: -PREMIUM_COST_KOBO,
    meta: { note: "Premium activated using wallet balance" }
  });

  return NextResponse.json({ ok: true, plan_expires_at: base.toISOString() });
}
