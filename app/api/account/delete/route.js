import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Deletes a user's account completely. Runs server-side with the service role key
// because deleting an auth user requires admin privileges the client never has.
//
// Order matters: tables without ON DELETE CASCADE back to profiles (transactions,
// withdrawals, feedback, referrals) must be cleaned up explicitly first, or the
// final auth deletion would fail with a foreign-key error. Tables that DO cascade
// (wallets, uploads, quiz_attempts, usage) are left alone — deleting the profile
// row removes them automatically.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const admin = createAdminClient();
  const userId = user.id;

  try {
    await admin.from("transactions").delete().eq("user_id", userId);
    await admin.from("withdrawals").delete().eq("user_id", userId);
    await admin.from("feedback").delete().eq("user_id", userId);
    await admin.from("referrals").delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    // study_rooms.created_by has no ON DELETE CASCADE — reassign or remove rooms
    // this user created so the auth deletion below doesn't hit a foreign-key error.
    await admin.from("study_rooms").delete().eq("created_by", userId);

    // Deleting the auth user cascades to profiles, which cascades to wallets,
    // uploads, quiz_attempts, and usage automatically.
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Could not delete account: " + err.message }, { status: 500 });
  }
}
