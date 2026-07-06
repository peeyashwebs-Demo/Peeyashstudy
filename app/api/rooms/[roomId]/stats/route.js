import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Runs with the service role key deliberately: individual quiz_answers rows stay
// private via RLS (users can only read their own), but aggregated, non-attributed
// counts across a room's members are useful and safe to compute server-side here,
// after confirming the requester is actually a member of this room.
export async function GET(req, { params }) {
  const { roomId } = params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();

  const { data: membership } = await admin.from("room_members").select("*").eq("room_id", roomId).eq("user_id", user.id).maybeSingle();
  if (!membership) return NextResponse.json({ error: "You're not a member of this room." }, { status: 403 });

  const { data: room } = await admin.from("study_rooms").select("*").eq("id", roomId).single();

  const { data: members } = await admin
    .from("room_members").select("user_id, profiles(full_name)").eq("room_id", roomId);

  const memberIds = (members || []).map((m) => m.user_id);

  const { data: answers } = await admin
    .from("quiz_answers").select("concept, correct, user_id").in("user_id", memberIds.length ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  // Aggregate: for each concept, how many distinct members got at least one wrong
  const conceptMisses = {}; // concept -> Set of user_ids who missed it
  const conceptTotals = {}; // concept -> total attempts across room

  (answers || []).forEach((a) => {
    const concept = a.concept || "General";
    conceptTotals[concept] = (conceptTotals[concept] || 0) + 1;
    if (!a.correct) {
      if (!conceptMisses[concept]) conceptMisses[concept] = new Set();
      conceptMisses[concept].add(a.user_id);
    }
  });

  const weakSpots = Object.keys(conceptMisses)
    .map((concept) => ({
      concept,
      membersStruggling: conceptMisses[concept].size,
      totalAttempts: conceptTotals[concept] || 0
    }))
    .filter((w) => w.membersStruggling >= 1)
    .sort((a, b) => b.membersStruggling - a.membersStruggling)
    .slice(0, 8);

  return NextResponse.json({
    room,
    members: (members || []).map((m) => ({ name: m.profiles?.full_name || "Student" })),
    weakSpots
  });
}
