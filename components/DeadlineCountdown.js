"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";

function timeLeft(dueDate) {
  const diff = new Date(dueDate) - new Date();
  if (diff <= 0) return { expired: true, label: "Overdue" };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0) return { expired: false, label: `${days}d ${hours}h left`, urgent: days <= 2 };
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return { expired: false, label: `${hours}h ${mins}m left`, urgent: true };
}

export default function DeadlineCountdown() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", course_code: "", due_date: "" });
  const [, forceTick] = useState(0);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("deadlines").select("*").eq("user_id", user.id)
      .order("due_date", { ascending: true });
    setDeadlines(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Re-render every minute so countdowns stay live without a full refetch
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  async function addDeadline(e) {
    e.preventDefault();
    if (!form.title || !form.due_date) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("deadlines").insert({
      user_id: user.id, title: form.title, course_code: form.course_code || null,
      due_date: new Date(form.due_date).toISOString()
    });
    setForm({ title: "", course_code: "", due_date: "" });
    setShowForm(false);
    load();
  }

  async function remove(id) {
    const supabase = createClient();
    await supabase.from("deadlines").delete().eq("id", id);
    load();
  }

  const upcoming = deadlines.filter((d) => new Date(d.due_date) > new Date());
  const next = upcoming[0];

  if (loading) return <Skel className="h-24 w-full rounded-2xl mb-6" />;

  return (
    <div className="mb-6">
      {next ? (
        <div className={`rounded-2xl p-5 mb-3 ${timeLeft(next.due_date).urgent ? "bg-red-50 border border-red-200" : "bg-ink text-paper"}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs font-mono uppercase mb-1 ${timeLeft(next.due_date).urgent ? "text-red-500" : "text-paper/60"}`}>
                {next.course_code || "Next deadline"}
              </p>
              <p className={`font-medium text-sm truncate ${timeLeft(next.due_date).urgent ? "text-red-800" : "text-paper"}`}>{next.title}</p>
            </div>
            <p className={`font-display text-lg sm:text-xl font-semibold shrink-0 whitespace-nowrap ${timeLeft(next.due_date).urgent ? "text-red-600" : "text-high"}`}>
              {timeLeft(next.due_date).label}
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-line rounded-2xl p-5 mb-3 text-center">
          <p className="text-sm text-ink/50">No deadlines tracked yet.</p>
        </div>
      )}

      {upcoming.length > 1 && (
        <div className="space-y-1.5 mb-3">
          {upcoming.slice(1).map((d) => (
            <div key={d.id} className="flex justify-between items-center gap-2 text-xs text-ink/50 px-1">
              <span className="truncate min-w-0">{d.title}</span>
              <span className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                {timeLeft(d.due_date).label}
                <button onClick={() => remove(d.id)} className="text-ink/30 hover:text-red-500" aria-label="Remove">×</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="text-xs text-biro underline">+ Add a deadline</button>
      ) : (
        <form onSubmit={addDeadline} className="border border-line rounded-xl p-4 space-y-2">
          <input required placeholder="Assignment title (e.g. MCM102 TMA)" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm focus-ring" />
          <div className="flex flex-col sm:flex-row gap-2">
            <input placeholder="Course code (optional)" value={form.course_code}
              onChange={(e) => setForm({ ...form, course_code: e.target.value })}
              className="w-full sm:flex-1 min-w-0 border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm focus-ring" />
            <input required type="datetime-local" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full sm:flex-1 min-w-0 border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm focus-ring" />
          </div>
          <div className="flex gap-2">
            <button className="bg-ink text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-biro transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-ink/50 px-2">Cancel</button>
          </div>
        </form>
      )}
      {next && <button onClick={() => remove(next.id)} className="text-xs text-ink/30 hover:text-red-500 mt-2 block">Remove "{next.title}"</button>}
    </div>
  );
}
