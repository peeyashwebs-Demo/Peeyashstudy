import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const MIN_WITHDRAWAL_KOBO = 500000; // ₦5,000

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { amountKobo, bankName, accountNumber, accountName } = await req.json();
  const admin = createAdminClient();
  const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", user.id).single();

  if (amountKobo < MIN_WITHDRAWAL_KOBO) {
    return NextResponse.json({ error: "Minimum withdrawal is ₦5,000." }, { status: 400 });
  }
  if (amountKobo > (wallet?.balance_kobo || 0)) {
    return NextResponse.json({ error: "Not enough balance." }, { status: 400 });
  }

  // hold the funds immediately so it can't be withdrawn twice
  await admin.from("wallets").update({ balance_kobo: wallet.balance_kobo - amountKobo }).eq("user_id", user.id);
  await admin.from("transactions").insert({
    user_id: user.id, type: "withdrawal", amount_kobo: -amountKobo, meta: { status: "pending" }
  });
  const { data: w } = await admin.from("withdrawals").insert({
    user_id: user.id, amount_kobo: amountKobo, bank_name: bankName,
    account_number: accountNumber, account_name: accountName, status: "pending"
  }).select().single();

  return NextResponse.json({ withdrawal: w });
}
