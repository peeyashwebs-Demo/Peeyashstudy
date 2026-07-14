import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data: conversations } = await admin
    .from("support_conversations")
    .select("*, profiles(full_name, email)")
    .neq("status", "closed")
    .order("last_message_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ conversations: conversations || [] });
}
