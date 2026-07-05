"use client";
import { useEffect, useState, useRef } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";

export default function Chat() {
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [activeKey, setActiveKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef(null);

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
    })();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || !activeKey) return;
    const q = input;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput(""); setLoading(true); setErr("");
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cacheKey: activeKey, history: messages, question: q })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErr(data.error); return; }
    setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10 flex flex-col h-[calc(100vh-4rem)]">
        <h1 className="font-display text-2xl font-semibold mb-4">Course chat</h1>
        {!activeKey ? (
          <div>
            <p className="text-sm text-ink/60 mb-4">Choose material to chat against.</p>
            {loadingUploads ? (
              <div className="space-y-2">
                <Skel className="h-11 w-full rounded-xl" />
                <Skel className="h-11 w-full rounded-xl" />
                <Skel className="h-11 w-3/4 rounded-xl" />
              </div>
            ) : uploads.length === 0 ? (
              <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">Upload an assignment first.</p>
            ) : (
              <ul className="space-y-2">
                {uploads.map((u) => (
                  <li key={u.cache_key}>
                    <button onClick={() => setActiveKey(u.cache_key)}
                      className="w-full text-left border border-line rounded-xl px-4 py-3 text-sm hover:border-biro transition-colors">
                      {u.original_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role === "user" ? "bg-ink text-paper ml-auto" : "bg-white border border-line"}`}>
                  {m.text}
                </div>
              ))}
              {loading && <p className="text-sm text-ink/40">Thinking…</p>}
              {err && <p className="text-sm text-red-600">{err}</p>}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about this material…"
                className="flex-1 border border-line rounded-full px-4 py-2.5 text-sm focus-ring" />
              <button onClick={send} className="bg-ink text-paper px-5 py-2.5 rounded-full text-sm font-medium hover:bg-biro transition-colors">Send</button>
            </div>
          </>
        )}
      </main>
    </>
  );
}
