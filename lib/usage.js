// Free-tier limits. Premium users skip all checks.
export const LIMITS = { uploads: 3, quizzes: 2, chat: 5 }; // uploads+quizzes per month, chat per day

export function monthKey() { return new Date().toISOString().slice(0, 7); }
export function dayKey() { return new Date().toISOString().slice(0, 10); }

export async function checkAndCount(admin, userId, kind, isPremium) {
  if (isPremium) return { ok: true };
  const period = kind === "chat" ? dayKey() : monthKey();
  const { data } = await admin
    .from("usage")
    .select("used")
    .eq("user_id", userId).eq("period", period).eq("kind", kind)
    .maybeSingle();
  const used = data?.used || 0;
  if (used >= LIMITS[kind]) return { ok: false, used, limit: LIMITS[kind] };
  await admin.from("usage").upsert(
    { user_id: userId, period, kind, used: used + 1 },
    { onConflict: "user_id,period,kind" }
  );
  return { ok: true, used: used + 1, limit: LIMITS[kind] };
}

export function isPremium(profile) {
  return profile?.plan === "premium" &&
    profile?.plan_expires_at && new Date(profile.plan_expires_at) > new Date();
}
