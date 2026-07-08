import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/usage";

const FREE_ROOM_LIMIT = 1;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (0/O, 1/I)
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { name, courseCode } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Give your room a name." }, { status: 400 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();

  if (!isPremium(profile)) {
    const { count } = await admin.from("room_members").select("*", { count: "exact", head: true }).eq("user_id", user.id);
    if ((count || 0) >= FREE_ROOM_LIMIT) {
      return NextResponse.json(
        { error: `Free plan allows ${FREE_ROOM_LIMIT} study room. Upgrade to Premium to join or create unlimited rooms.` },
        { status: 429 }
      );
    }
  }

  let inviteCode, attempts = 0;
  do {
    inviteCode = generateCode();
    const { data: existing } = await admin.from("study_rooms").select("id").eq("invite_code", inviteCode).maybeSingle();
    if (!existing) break;
    attempts++;
  } while (attempts < 5);

  const { data: room, error } = await admin.from("study_rooms").insert({
    name: name.trim(), course_code: courseCode || null, invite_code: inviteCode, created_by: user.id
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("room_members").insert({ room_id: room.id, user_id: user.id });

  return NextResponse.json({ room });
}
