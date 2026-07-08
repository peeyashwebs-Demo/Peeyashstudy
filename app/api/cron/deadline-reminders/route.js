import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/webpush";

// Runs once a day (see vercel.json). Finds deadlines due within the next 48
// hours that haven't been reminded about yet, sends one push per deadline,
// and marks it reminded so the same deadline never notifies twice.
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: deadlines } = await admin
    .from("deadlines")
    .select("*")
    .is("reminded_at", null)
    .gte("due_date", now.toISOString())
    .lte("due_date", in48h.toISOString());

  for (const d of deadlines || []) {
    await sendPushToUser(admin, d.user_id, {
      title: `${d.title} is due soon`,
      body: d.course_code ? `${d.course_code} — due within 48 hours.` : "Due within the next 48 hours.",
      url: "/dashboard"
    }).catch(() => {});
    await admin.from("deadlines").update({ reminded_at: now.toISOString() }).eq("id", d.id);
  }

  return NextResponse.json({ ok: true, reminded: deadlines?.length || 0 });
}
