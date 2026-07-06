"use client";
import { useState } from "react";

const verdictStyles = {
  strong: { bg: "bg-leaf/10", border: "border-leaf/30", text: "text-leaf", label: "You've got it" },
  partial: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Partly there" },
  weak: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Let's revisit this" }
};

export default function ExplainBack({ concept, question }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  async function submit() {
    setLoading(true); setErr(""); setResult(null);
    const res = await fetch("/api/explain-back", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concept, question, explanation })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setResult(data.result);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs font-medium text-biro hover:text-ink transition-colors inline-flex items-center gap-1">
        Explain it back to me →
      </button>
    );
  }

  return (
    <div className="mt-2 border border-line rounded-xl p-3 bg-paper">
      <p className="text-xs text-ink/60 mb-2">In your own words — what does this actually mean?</p>
      <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)}
        placeholder="Type your explanation…"
        className="w-full border border-line rounded-lg px-3 py-2 text-base sm:text-sm mb-2 focus-ring" />
      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={loading || explanation.trim().length < 5}
          className="bg-ink text-paper px-4 py-1.5 rounded-full text-xs font-medium hover:bg-biro transition-colors disabled:opacity-40">
          {loading ? "Checking…" : "Check my understanding"}
        </button>
        <button onClick={() => { setOpen(false); setResult(null); setExplanation(""); }}
          className="text-xs text-ink/40">Cancel</button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      {result && (
        <div className={`mt-3 rounded-lg p-3 border ${verdictStyles[result.verdict]?.bg} ${verdictStyles[result.verdict]?.border}`}>
          <p className={`text-xs font-semibold mb-1 ${verdictStyles[result.verdict]?.text}`}>{verdictStyles[result.verdict]?.label}</p>
          <p className="text-xs text-ink/70 leading-relaxed">{result.feedback}</p>
          {result.correction && <p className="text-xs text-ink/60 mt-2 leading-relaxed">{result.correction}</p>}
        </div>
      )}
    </div>
  );
}
