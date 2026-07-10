"use client";
import Link from "next/link";
import { useState } from "react";
import Nav from "@/components/Nav";
import ExplainBack from "@/components/ExplainBack";

export default function UploadPage() {
  const [mode, setMode] = useState("pdf"); // "pdf" | "text"
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [cacheKey, setCacheKey] = useState(null);

  const canSubmit = mode === "pdf" ? !!file : pastedText.trim().length >= 8;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setErr(""); setResult(null);
    const fd = new FormData();
    if (mode === "pdf") fd.append("file", file);
    else fd.append("rawText", pastedText);
    try {
      const res = await fetch("/api/decode", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
      setResult(data.breakdown);
      setCacheKey(data.cacheKey);
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Upload an assignment</h1>
        <p className="text-sm text-ink/60 mb-6">
          PDF, typed, or pasted — any subject, including Math, Stats, and Accounting.
          We'll break down every question, never write it for you.
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("pdf")}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              mode === "pdf" ? "bg-ink text-paper" : "border border-line text-ink/60 hover:border-biro"
            }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => setMode("text")}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              mode === "text" ? "bg-ink text-paper" : "border border-line text-ink/60 hover:border-biro"
            }`}
          >
            Type or paste text
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {mode === "pdf" ? (
            <div className="border border-dashed border-line rounded-2xl p-6 sm:p-8 text-center">
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm mb-4 text-ink/60
                  file:mr-3 file:mb-2 file:py-2.5 file:px-4 file:rounded-full file:border-0
                  file:bg-ink file:text-paper file:text-sm file:font-medium
                  hover:file:bg-biro file:transition-colors file:cursor-pointer cursor-pointer" />
            </div>
          ) : (
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste or type your assignment question(s) here — works for essays, Math, Statistics, Accounting, anything…"
              rows={8}
              className="w-full border border-line rounded-2xl px-4 py-4 text-base sm:text-sm focus-ring mb-4"
            />
          )}
          <button disabled={!canSubmit || loading}
            className="w-full sm:w-auto bg-ink text-paper px-6 py-3.5 sm:py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors disabled:opacity-40">
            {loading ? "Reading your assignment… (up to 30s)" : "Decode this assignment"}
          </button>
        </form>

        {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

        {result && (
          <div className="mt-8 space-y-6">
            <div>
              <p className="font-mono text-xs uppercase text-biro">{result.course_code || "Assignment"}</p>
              <h2 className="font-display text-xl font-semibold">{result.title}</h2>
            </div>
            {result.questions?.map((q, i) => (
              <div key={i} className="border border-line rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium">Q{i + 1}: {q.question}</p>
                  {q.problem_type === "quantitative" && (
                    <span className="shrink-0 text-xs bg-biro/10 text-biro px-2 py-1 rounded-full font-medium whitespace-nowrap">Step-by-step</span>
                  )}
                </div>
                <p className="text-sm text-ink/70 mb-3"><span className="font-medium text-ink">Really asking:</span> {q.really_asking}</p>
                <p className="text-sm text-ink/70 mb-3">{q.explanation}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {q.key_concepts?.map((c, j) => (
                    <span key={j} className="text-xs bg-line/60 px-2 py-1 rounded-full">{c}</span>
                  ))}
                </div>

                {q.problem_type === "quantitative" ? (
                  <>
                    {q.method && (
                      <div className="bg-biro/5 border border-biro/20 rounded-xl p-4 mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-biro mb-1">Method to use</p>
                        <p className="text-sm text-ink/80 leading-relaxed">{q.method}</p>
                      </div>
                    )}
                    {q.worked_similar_example && (
                      <div className="border border-line rounded-xl p-4 mb-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50 mb-2">Worked example (different numbers)</p>
                        <p className="text-sm text-ink/80 mb-3">{q.worked_similar_example.setup}</p>
                        <ol className="space-y-1.5 mb-3">
                          {q.worked_similar_example.steps?.map((s, j) => (
                            <li key={j} className="text-sm text-ink/80 flex gap-2">
                              <span className="text-biro font-medium shrink-0">{j + 1}.</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                        {q.worked_similar_example.answer && (
                          <p className="text-sm font-medium bg-leaf/10 text-leaf rounded-lg px-3 py-2">
                            Answer to this example: {q.worked_similar_example.answer}
                          </p>
                        )}
                      </div>
                    )}
                    {q.how_to_apply?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1">Now apply it to your own numbers:</p>
                        <ul className="text-sm text-ink/70 space-y-1">
                          {q.how_to_apply.map((s, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-leaf shrink-0">✓</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">Suggested structure:</p>
                    <ul className="text-sm text-ink/70 list-disc list-inside space-y-0.5 mb-3">
                      {q.answer_structure?.map((s, j) => <li key={j}>{s}</li>)}
                    </ul>
                  </>
                )}

                {q.common_mistakes?.length > 0 && (
                  <p className="text-xs text-ink/50 mb-3">⚠️ Common mistake: {q.common_mistakes[0]}</p>
                )}

                <ExplainBack concept={(q.key_concepts || []).join(", ")} question={q.question} />
              </div>
            ))}
            {result.study_tip && (
              <p className="text-sm bg-high/30 border border-high rounded-xl p-4">💡 {result.study_tip}</p>
            )}
            {cacheKey && (
              <Link href={`/worked-example?key=${cacheKey}`}
                className="block text-center bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors">
                See a fully worked example on a similar question →
              </Link>
            )}
          </div>
        )}
      </main>
    </>
  );
}
