import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/usage";

const FREE_ROOM_LIMIT = 1;

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

  await admin.from("room_members").insert({ room_id: room.id, user_id: user.id });
  return NextResponse.json({ room });
}
