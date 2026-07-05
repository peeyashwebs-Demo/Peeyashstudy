import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import PayoutButtons from "@/components/PayoutButtons";

export default async function Admin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: pending } = await admin.from("withdrawals").select("*, profiles(full_name, email)").eq("status", "pending").order("created_at");
  const { count: feedbackCount } = await admin.from("feedback").select("*", { count: "exact", head: true });
  const { data: cacheStats } = await admin.from("document_cache").select("cache_key, course_code, hit_count").order("hit_count", { ascending: false }).limit(10);

  return (
    <>
      <Nav authed />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-8">Admin</h1>

        <h2 className="font-display text-lg font-semibold mb-3">Pending withdrawals</h2>
        <div className="space-y-3 mb-10">
          {pending?.length ? pending.map((w) => (
            <div key={w.id} className="border border-line rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="font-medium">₦{(w.amount_kobo / 100).toLocaleString()}</span>
                <span className="text-ink/50">{w.profiles?.full_name}</span>
              </div>
              <p className="text-ink/60 mb-3">{w.bank_name} · {w.account_number} · {w.account_name}</p>
              <PayoutButtons withdrawalId={w.id} />
            </div>
          )) : <p className="text-sm text-ink/50">Nothing pending.</p>}
        </div>

        <h2 className="font-display text-lg font-semibold mb-3">Most-cached documents (AI cost saved)</h2>
        <ul className="text-sm border border-line rounded-xl divide-y divide-line mb-10">
          {cacheStats?.map((c) => (
            <li key={c.cache_key} className="px-4 py-2.5 flex justify-between">
              <span>{c.course_code || "Unknown"}</span><span className="font-mono text-ink/50">{c.hit_count}× served free</span>
            </li>
          ))}
        </ul>

        <h2 className="font-display text-lg font-semibold mb-3">Feedback</h2>
        <Link href="/admin/feedback" className="block border border-line rounded-xl p-4 hover:border-biro transition-colors mb-10">
          <p className="text-sm text-ink/70">{feedbackCount ? `${feedbackCount} response${feedbackCount === 1 ? "" : "s"} — view all, ratings, and history →` : "No feedback yet →"}</p>
        </Link>
      </main>
    </>
  );
}
