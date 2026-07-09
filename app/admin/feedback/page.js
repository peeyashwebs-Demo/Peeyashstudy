import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";

export default async function AdminFeedback() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: feedback } = await admin
    .from("feedback")
    .select("*, profiles(full_name, email, school)")
    .order("created_at", { ascending: false });

  const total = feedback?.length || 0;
  const avgRating = total ? (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : "—";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedback?.filter((f) => f.rating === star).length || 0
  }));
  const lowRated = feedback?.filter((f) => f.rating <= 2).length || 0;

  return (
    <>
      <Nav authed />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <Link href="/admin" className="text-sm text-ink/50 hover:text-biro">← Admin</Link>
        <h1 className="font-display text-2xl font-semibold mt-2 mb-8">Feedback</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="border border-line rounded-xl p-4">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Total responses</p>
            <p className="font-display text-2xl font-semibold">{total}</p>
          </div>
          <div className="border border-line rounded-xl p-4">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Average rating</p>
            <p className="font-display text-2xl font-semibold">{avgRating} <span className="text-sm font-normal text-ink/40">/5</span></p>
          </div>
          <div className="border border-line rounded-xl p-4">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">1–2 star (needs attention)</p>
            <p className="font-display text-2xl font-semibold text-red-600">{lowRated}</p>
          </div>
        </div>

        <div className="flex gap-1.5 mb-8">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex-1">
              <div className="h-16 bg-line/40 rounded-md relative overflow-hidden flex items-end">
                <div
                  className={star <= 2 ? "bg-red-300 w-full" : "bg-biro w-full"}
                  style={{ height: total ? `${(count / total) * 100}%` : "0%" }}
                />
              </div>
              <p className="text-center text-xs text-ink/50 mt-1">{star}★ ({count})</p>
            </div>
          ))}
        </div>

        <h2 className="font-display text-lg font-semibold mb-3">All feedback</h2>
        {total === 0 ? (
          <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">
            No feedback submitted yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {feedback.map((f) => (
              <li key={f.id} className={`border rounded-xl p-4 text-sm ${f.rating <= 2 ? "border-red-200 bg-red-50/40" : "border-line"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}
                  </span>
                  <span className="text-xs text-ink/40 font-mono">
                    {f.profiles?.full_name || "Unknown"} · {new Date(f.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-ink/80 leading-relaxed">{f.message}</p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
