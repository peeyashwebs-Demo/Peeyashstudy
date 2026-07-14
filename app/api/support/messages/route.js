import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ messages: [] });

  const admin = createAdminClient();
  const { data: messages } = await admin
    .from("support_messages").select("*").eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  const { data: conv } = await admin
    .from("support_conversations").select("status, user_typing_at, admin_typing_at").eq("id", conversationId).maybeSingle();

  return NextResponse.json({
    messages: messages || [],
    status: conv?.status || null,
    userTypingAt: conv?.user_typing_at || null,
    adminTypingAt: conv?.admin_typing_at || null
  });
}
