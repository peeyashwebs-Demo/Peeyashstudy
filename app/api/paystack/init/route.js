import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Initializes a Paystack transaction for the ₦5,000 monthly subscription.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: user.email,
      amount: 500000, // ₦5,000 in kobo
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=1`,
      metadata: { user_id: user.id, purpose: "premium_subscription" }
    })
  });
  const data = await res.json();
  if (!data.status) return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  return NextResponse.json({ url: data.data.authorization_url });
}
