import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ai, parseJsonLoose } from "@/lib/gemini";
import { supportPrompt } from "@/lib/supportPrompt";
import { sendPushToUser } from "@/lib/webpush";

async function notifyAdmin(admin, conversation, preview) {
  if (!process.env.ADMIN_EMAIL) return;
  const { data: adminProfile } = await admin
    .from("profiles").select("id").eq("email", process.env.ADMIN_EMAIL).maybeSingle();
  if (!adminProfile) return;
  sendPushToUser(admin, adminProfile.id, {
    title: "Support needs you 🆘",
    body: preview.slice(0, 120),
    url: `/admin/support?id=${conversation.id}`
  }).catch(() => {});
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { conversationId, message, sessionId, guestName, forceHuman } = await req.json();

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message required." }, { status: 400 });
  }

  const admin = createAdminClient();
  let conversation = null;

  if (conversationId) {
    const { data } = await admin.from("support_conversations").select("*").eq("id", conversationId).maybeSingle();
    conversation = data;
  }
  if (!conversation) {
    const { data, error } = await admin.from("support_conversations").insert({
      user_id: user?.id || null,
      session_id: user ? null : (sessionId || null),
      guest_name: user ? null : (guestName || null),
      status: "ai"
    }).select().single();
    if (error) return NextResponse.json({ error: "Could not start conversation." }, { status: 500 });
    conversation = data;
  }

  await admin.from("support_messages").insert({ conversation_id: conversation.id, sender: "user", content: message.trim() });
  await admin.from("support_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation.id);

  // Already handed off to a human — don't let the AI jump back in. Just notify
  // the admin there's a new message waiting and let the widget poll for their reply.
  if (conversation.status === "waiting_human" || conversation.status === "human_active") {
    notifyAdmin(admin, conversation, message.trim());
    return NextResponse.json({ conversationId: conversation.id, status: conversation.status });
  }

  // User explicitly asked for a real person
  if (forceHuman) {
    await admin.from("support_conversations").update({ status: "waiting_human" }).eq("id", conversation.id);
    const reply = "Got it — connecting you with a real team member now. They usually reply within a few hours. Feel free to add more detail here in the meantime.";
    await admin.from("support_messages").insert({ conversation_id: conversation.id, sender: "ai", content: reply });
    notifyAdmin(admin, conversation, message.trim());
    return NextResponse.json({ conversationId: conversation.id, reply, escalated: true });
  }

  const { data: history } = await admin
    .from("support_messages").select("sender, content").eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true }).limit(20);

  let reply, escalate;
  try {
    const raw = await ai(supportPrompt(history || [], message.trim()), { tier: "fast", json: true });
    const parsed = parseJsonLoose(raw);
    reply = parsed.reply || "Let me connect you with a real team member for this one.";
    escalate = !!parsed.escalate;
  } catch (e) {
    console.error("Support AI error:", e);
    reply = "Sorry, I'm having trouble right now — let me connect you with a real team member.";
    escalate = true;
  }

  await admin.from("support_messages").insert({ conversation_id: conversation.id, sender: "ai", content: reply });

  if (escalate) {
    await admin.from("support_conversations").update({ status: "waiting_human" }).eq("id", conversation.id);
    notifyAdmin(admin, conversation, message.trim());
  }

  return NextResponse.json({ conversationId: conversation.id, reply, escalated: escalate });
}
