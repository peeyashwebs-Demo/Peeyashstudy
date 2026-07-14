import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { conversationId, message, close } = await req.json();
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });

  const admin = createAdminClient();

  if (message?.trim()) {
    await admin.from("support_messages").insert({ conversation_id: conversationId, sender: "admin", content: message.trim() });
  }

  await admin.from("support_conversations").update({
    status: close ? "closed" : "human_active",
    last_message_at: new Date().toISOString()
  }).eq("id", conversationId);

  return NextResponse.json({ ok: true });
}
