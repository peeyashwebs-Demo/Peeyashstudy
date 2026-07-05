"use client";
import { useState } from "react";
import Nav from "@/components/Nav";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setErr(""); setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/decode", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
      setResult(data.breakdown);
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
        <p className="text-sm text-ink/60 mb-6">PDF works best. We'll break down every question — never write it for you.</p>

        <form onSubmit={onSubmit} className="border border-dashed border-line rounded-2xl p-8 text-center">
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm mb-4" />
          <button disabled={!file || loading}
            className="bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors disabled:opacity-40">
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
                <p className="font-medium mb-2">Q{i + 1}: {q.question}</p>
                <p className="text-sm text-ink/70 mb-3"><span className="font-medium text-ink">Really asking:</span> {q.really_asking}</p>
                <p className="text-sm text-ink/70 mb-3">{q.explanation}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {q.key_concepts?.map((c, j) => (
                    <span key={j} className="text-xs bg-line/60 px-2 py-1 rounded-full">{c}</span>
                  ))}
                </div>
                <p className="text-sm font-medium mb-1">Suggested structure:</p>
                <ul className="text-sm text-ink/70 list-disc list-inside space-y-0.5">
                  {q.answer_structure?.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
              </div>
            ))}
            {result.study_tip && (
              <p className="text-sm bg-high/30 border border-high rounded-xl p-4">💡 {result.study_tip}</p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
