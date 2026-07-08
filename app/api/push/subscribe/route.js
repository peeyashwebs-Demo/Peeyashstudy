import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const subscription = await req.json();
  const admin = createAdminClient();

  await admin.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint: subscription.endpoint, keys: subscription.keys },
    { onConflict: "endpoint" }
  );

  return NextResponse.json({ ok: true });
}
