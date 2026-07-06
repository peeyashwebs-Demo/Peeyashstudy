"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";

function WorkedExampleContent() {
  const params = useSearchParams();
  const preselect = params.get("key");
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [activeKey, setActiveKey] = useState(preselect || null);
  const [example, setExample] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingUploads(false); return; }
      const { data } = await supabase
        .from("uploads").select("cache_key, original_name")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      setUploads(data || []);
      setLoadingUploads(false);
      if (preselect) loadExample(preselect);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadExample(cacheKey) {
    setActiveKey(cacheKey);
    setLoading(true); setErr(""); setExample(null);
    const res = await fetch("/api/worked-example", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cacheKey })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setExample(data.workedExample);
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Worked example</h1>
        <p className="text-sm text-ink/60 mb-6">
          We'll invent a different question — same course, same theory — and fully solve it,
          so you can study the method. This is never your actual assignment.
        </p>

        {!example && !loading && (
          <>
            <p className="text-sm text-ink/60 mb-4">Pick the assignment you want a teaching example for.</p>
            {loadingUploads ? (
              <div className="space-y-2">
                <Skel className="h-11 w-full rounded-xl" />
                <Skel className="h-11 w-full rounded-xl" />
              </div>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">Upload an assignment first.</p>
            ) : (
              <ul className="space-y-2">
                {uploads.map((u) => (
                  <li key={u.cache_key}>
                    <button onClick={() => loadExample(u.cache_key)}
                      className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition-colors ${activeKey === u.cache_key ? "border-biro" : "border-line hover:border-biro"}`}>
                      {u.original_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
          </>
        )}

        {loading && (
          <div className="space-y-3">
            <Skel className="h-5 w-3/4" />
            <Skel className="h-20 w-full rounded-xl" />
            <Skel className="h-20 w-full rounded-xl" />
            <Skel className="h-20 w-full rounded-xl" />
          </div>
        )}

        {example && (
          <div className="space-y-6">
            <div className="bg-biro/5 border border-biro/20 rounded-2xl p-5">
              <p className="font-mono text-xs uppercase text-biro mb-2">A different question, same method</p>
              <p className="font-medium leading-relaxed">{example.sibling_question}</p>
              <p className="text-xs text-ink/50 mt-3">Theory anchor: {example.theory_anchor}</p>
            </div>

            {example.worked_answer_sections?.map((s, i) => (
              <div key={i} className="border border-line rounded-2xl p-5">
                <p className="font-display text-lg font-semibold mb-2">{s.heading}</p>
                <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">{s.content}</p>
              </div>
            ))}

            {example.teaching_notes && (
              <p className="text-sm bg-high/30 border border-high rounded-xl p-4">💡 {example.teaching_notes}</p>
            )}

            <button onClick={() => { setExample(null); setActiveKey(null); }}
              className="text-sm text-biro underline">← Try a different upload</button>
          </div>
        )}
      </main>
    </>
  );
}

export default function WorkedExample() {
  return <Suspense><WorkedExampleContent /></Suspense>;
}
