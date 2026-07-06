"use client";
import { useState } from "react";
import Nav from "@/components/Nav";

export default function DraftReview() {
  const [assignmentText, setAssignmentText] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fb, setFb] = useState(null);

  // Oral defense state
  const [defenseQuestions, setDefenseQuestions] = useState(null);
  const [defenseLoading, setDefenseLoading] = useState(false);
  const [defenseAnswers, setDefenseAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [defenseErr, setDefenseErr] = useState("");

  async function submit() {
    setLoading(true); setErr(""); setFb(null);
    setDefenseQuestions(null); setEvaluation(null); setDefenseAnswers({});
    const res = await fetch("/api/draft", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentText, draft })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setFb(data.feedback);
  }

  async function startDefense() {
    setDefenseLoading(true); setDefenseErr(""); setEvaluation(null);
    const res = await fetch("/api/draft/defense", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentText, draft })
    });
    const data = await res.json();
    setDefenseLoading(false);
    if (!res.ok) { setDefenseErr(data.error); return; }
    setDefenseQuestions(data.questions);
  }

  async function submitDefense() {
    setEvalLoading(true); setDefenseErr("");
    const qaPairs = defenseQuestions.map((q, i) => ({ question: q, answer: defenseAnswers[i] || "" }));
    const res = await fetch("/api/draft/defense/evaluate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentText, draft, qaPairs })
    });
    const data = await res.json();
    setEvalLoading(false);
    if (!res.ok) { setDefenseErr(data.error); return; }
    setEvaluation(data.evaluation);
  }

  const verdictColor = { solid: "text-leaf", shaky: "text-amber-600", concerning: "text-red-600" };

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Draft review</h1>
        <p className="text-sm text-ink/60 mb-6">Paste what you've written. We review it — we don't rewrite it. Premium feature.</p>

        <textarea placeholder="Assignment question (optional, helps context)" value={assignmentText}
          onChange={(e) => setAssignmentText(e.target.value)} rows={3}
          className="w-full border border-line rounded-xl px-4 py-3 text-base sm:text-sm mb-3 focus-ring" />
        <textarea placeholder="Paste your own draft answer here…" value={draft}
          onChange={(e) => setDraft(e.target.value)} rows={10}
          className="w-full border border-line rounded-xl px-4 py-3 text-base sm:text-sm mb-4 focus-ring" />
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

            {/* Oral defense entry point */}
            {!defenseQuestions && (
              <div className="border border-biro/30 bg-biro/5 rounded-2xl p-5">
                <p className="font-medium text-sm mb-1">Ready to prove you understand it?</p>
                <p className="text-xs text-ink/60 mb-3">
                  We'll ask you 4 quick follow-up questions about your own draft — like a lecturer
                  briefly checking your understanding before you submit.
                </p>
                <button onClick={startDefense} disabled={defenseLoading}
                  className="bg-biro text-paper px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ink transition-colors disabled:opacity-50">
                  {defenseLoading ? "Preparing questions…" : "Take the oral defense"}
                </button>
                {defenseErr && <p className="text-sm text-red-600 mt-2">{defenseErr}</p>}
              </div>
            )}
          </div>
        )}

        {/* Defense questions */}
        {defenseQuestions && !evaluation && (
          <div className="mt-8 space-y-4">
            <h2 className="font-display text-lg font-semibold">Oral defense</h2>
            <p className="text-sm text-ink/60">Answer in your own words — 1 to 3 sentences each is fine.</p>
            {defenseQuestions.map((q, i) => (
              <div key={i} className="border border-line rounded-xl p-4">
                <p className="text-sm font-medium mb-2">{i + 1}. {q}</p>
                <textarea rows={2} value={defenseAnswers[i] || ""}
                  onChange={(e) => setDefenseAnswers({ ...defenseAnswers, [i]: e.target.value })}
                  className="w-full border border-line rounded-lg px-3 py-2 text-base sm:text-sm focus-ring" />
              </div>
            ))}
            <button onClick={submitDefense} disabled={evalLoading}
              className="bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors disabled:opacity-50">
              {evalLoading ? "Reviewing your answers…" : "Submit answers"}
            </button>
            {defenseErr && <p className="text-sm text-red-600">{defenseErr}</p>}
          </div>
        )}

        {/* Defense evaluation */}
        {evaluation && (
          <div className="mt-8 space-y-5">
            <h2 className="font-display text-lg font-semibold">How you did</h2>
            <div className="border border-line rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium">Understanding score</span>
              <span className="font-display text-2xl">{evaluation.understanding_score}/10</span>
            </div>
            <p className="text-ink/80 text-sm">{evaluation.overall}</p>
            <div className="space-y-2">
              {evaluation.per_question?.map((p, i) => (
                <div key={i} className="border border-line rounded-xl p-3 text-sm">
                  <p className="font-medium mb-1">{p.question}</p>
                  <p className={`text-xs font-mono uppercase mb-1 ${verdictColor[p.verdict] || "text-ink/50"}`}>{p.verdict}</p>
                  <p className="text-ink/60">{p.note}</p>
                </div>
              ))}
            </div>
            {evaluation.next_steps?.length > 0 && (
              <div>
                <p className="font-medium mb-2 text-sm">Before you submit</p>
                <ul className="text-sm text-ink/70 list-disc list-inside space-y-1">
                  {evaluation.next_steps.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
