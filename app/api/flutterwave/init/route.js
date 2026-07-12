import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Initializes a Flutterwave transaction for the ₦5,000 monthly subscription.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  // Unique reference for this transaction — Flutterwave requires one you generate.
  const tx_ref = `premium-${user.id}-${Date.now()}`;

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref,
      amount: 5000, // ₦5,000 — Flutterwave takes the amount in Naira, NOT kobo
      currency: "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=1`,
      customer: { email: user.email },
      meta: { user_id: user.id, purpose: "premium_subscription" }
    })
  });
  const data = await res.json();
  if (data.status !== "success") {
    console.error("Flutterwave init failed:", data);
    return NextResponse.json({ error: data.message || "Could not start payment.", details: data }, { status: 500 });
  }
  return NextResponse.json({ url: data.data.link });
}
