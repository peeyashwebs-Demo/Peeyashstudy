import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) return NextResponse.json({ error: "Enter an invite code." }, { status: 400 });

  const admin = createAdminClient();
  const { data: room } = await admin.from("study_rooms").select("*").eq("invite_code", inviteCode.trim().toUpperCase()).maybeSingle();
  if (!room) return NextResponse.json({ error: "No room found with that code." }, { status: 404 });

  const { data: existing } = await admin.from("room_members").select("*").eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ room, alreadyMember: true });

  await admin.from("room_members").insert({ room_id: room.id, user_id: user.id });
  return NextResponse.json({ room });
}
