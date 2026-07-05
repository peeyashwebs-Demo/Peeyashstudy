"use client";
import { useState } from "react";
import Nav from "@/components/Nav";

export default function DraftReview() {
  const [assignmentText, setAssignmentText] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fb, setFb] = useState(null);

  async function submit() {
    setLoading(true); setErr(""); setFb(null);
    const res = await fetch("/api/draft", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentText, draft })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setFb(data.feedback);
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Draft review</h1>
        <p className="text-sm text-ink/60 mb-6">Paste what you've written. We review it — we don't rewrite it. Premium feature.</p>

        <textarea placeholder="Assignment question (optional, helps context)" value={assignmentText}
          onChange={(e) => setAssignmentText(e.target.value)} rows={3}
          className="w-full border border-line rounded-xl px-4 py-3 text-sm mb-3 focus-ring" />
        <textarea placeholder="Paste your own draft answer here…" value={draft}
          onChange={(e) => setDraft(e.target.value)} rows={10}
          className="w-full border border-line rounded-xl px-4 py-3 text-sm mb-4 focus-ring" />
        <button onClick={submit} disabled={loading || !draft}
          className="bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors disabled:opacity-40">
          {loading ? "Reviewing…" : "Get feedback"}
        </button>
        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {fb && (
          <div className="mt-8 space-y-5">
            <p className="text-ink/80">{fb.overall}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-line rounded-xl p-4">
                <p className="text-xs font-mono uppercase text-ink/50">Structure</p>
                <p className="font-display text-2xl">{fb.structure_score}/10</p>
              </div>
              <div className="border border-line rounded-xl p-4">
                <p className="text-xs font-mono uppercase text-ink/50">Clarity</p>
                <p className="font-display text-2xl">{fb.clarity_score}/10</p>
              </div>
            </div>
            <div>
              <p className="font-medium mb-2">What's working</p>
              <ul className="text-sm text-ink/70 list-disc list-inside space-y-1">
                {fb.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">To fix</p>
              <div className="space-y-2">
                {fb.issues?.map((it, i) => (
                  <div key={i} className="border border-line rounded-xl p-3 text-sm">
                    <p className="font-medium">{it.issue}</p>
                    <p className="text-ink/60">{it.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
