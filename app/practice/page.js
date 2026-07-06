"use client";
import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";
import ShareBadge from "@/components/ShareBadge";

export default function Practice() {
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingUploads(false); return; }
      const { data } = await supabase
        .from("uploads").select("cache_key, original_name, created_at")
        .eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      setUploads(data || []);
      setLoadingUploads(false);
    })();
  }, []);

  async function loadQuiz(cacheKey) {
    setLoading(true); setErr(""); setQuiz(null); setSubmitted(false); setAnswers({});
    setActiveKey(cacheKey);
    const res = await fetch("/api/quiz", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cacheKey })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setQuiz(data.quiz);
  }

  function score() {
    return quiz.questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
  }

  async function submit() {
    setSubmitted(true);
    const perQuestion = quiz.questions.map((q, i) => ({
      concept: q.concept || "General",
      correct: answers[i] === q.answer
    }));
    await fetch("/api/quiz/attempt", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cacheKey: activeKey, score: score(), total: quiz.questions.length, perQuestion })
    });
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-6">Practice</h1>

        {!quiz && (
          <>
            <p className="text-sm text-ink/60 mb-4">Pick something you've uploaded to generate a quiz from it.</p>
            {loadingUploads ? (
              <div className="space-y-2">
                <Skel className="h-11 w-full rounded-xl" />
                <Skel className="h-11 w-full rounded-xl" />
                <Skel className="h-11 w-3/4 rounded-xl" />
              </div>
            ) : (
              <>
                {uploads.length === 0 && <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">Upload an assignment first.</p>}
                <ul className="space-y-2">
                  {uploads.map((u) => (
                    <li key={u.cache_key}>
                      <button onClick={() => loadQuiz(u.cache_key)}
                        className="w-full text-left border border-line rounded-xl px-4 py-3 text-sm hover:border-biro transition-colors">
                        {u.original_name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {loading && <p className="mt-4 text-sm text-ink/60">Building your quiz…</p>}
            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
          </>
        )}

        {quiz && (
          <div className="space-y-6">
            {quiz.questions.map((q, i) => (
              <div key={i} className="border border-line rounded-2xl p-5">
                <p className="font-medium mb-3">{i + 1}. {q.q}</p>
                <div className="space-y-2">
                  {q.options.map((opt, j) => {
                    const chosen = answers[i] === j;
                    const correct = submitted && j === q.answer;
                    const wrong = submitted && chosen && j !== q.answer;
                    return (
                      <button key={j} disabled={submitted}
                        onClick={() => setAnswers({ ...answers, [i]: j })}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors
                          ${correct ? "border-leaf bg-leaf/10" : wrong ? "border-red-400 bg-red-50" : chosen ? "border-biro bg-biro/10" : "border-line"}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && <p className="text-xs text-ink/60 mt-2">{q.why}</p>}
              </div>
            ))}
            {!submitted ? (
              <button onClick={submit} className="bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors">Submit answers</button>
            ) : (
              <>
                <p className="font-display text-xl mb-4">You scored {score()} / {quiz.questions.length}</p>
                {score() / quiz.questions.length >= 0.7 && (
                  <ShareBadge
                    headline={`I scored ${score()}/${quiz.questions.length} on my practice quiz`}
                    subtext="Studying smarter with PeeyashStudy 🎓"
                  />
                )}
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
}
