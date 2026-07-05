import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Founder marks a withdrawal as paid AFTER sending the transfer manually via bank app.
export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { withdrawalId, action } = await req.json(); // action: "paid" | "rejected"
  const admin = createAdminClient();
  const { data: wd } = await admin.from("withdrawals").select("*").eq("id", withdrawalId).single();
  if (!wd) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (action === "rejected") {
    // refund the held amount back to the wallet
    const { data: wallet } = await admin.from("wallets").select("balance_kobo").eq("user_id", wd.user_id).single();
    await admin.from("wallets").update({ balance_kobo: (wallet?.balance_kobo || 0) + wd.amount_kobo }).eq("user_id", wd.user_id);
    await admin.from("transactions").insert({
      user_id: wd.user_id, type: "withdrawal_refund", amount_kobo: wd.amount_kobo, meta: { withdrawal_id: withdrawalId }
    });
  }

  await admin.from("withdrawals").update({ status: action, processed_at: new Date().toISOString() }).eq("id", withdrawalId);
  return NextResponse.json({ ok: true });
}
