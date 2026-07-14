"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("supportSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("supportSessionId", id);
  }
  return id;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("ai"); // ai | waiting_human | human_active | closed
  const [conversationId, setConversationId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data?.user?.email || null));
    const savedConvo = localStorage.getItem("supportConversationId");
    if (savedConvo) setConversationId(savedConvo);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Poll for new messages (e.g. admin replies) while the widget is open
  useEffect(() => {
    if (!open || !conversationId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/support/messages?conversationId=${conversationId}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
        if (data.status) setStatus(data.status);
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 4000);
    return () => clearInterval(pollRef.current);
  }, [open, conversationId]);

  async function send(forceHuman = false) {
    const text = forceHuman ? "I'd like to talk to a real person, please." : input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    // If the last conversation was closed, start fresh instead of reopening it
    let activeConvoId = conversationId;
    if (status === "closed") {
      activeConvoId = null;
      setConversationId(null);
      setMessages([]);
      setStatus("ai");
      localStorage.removeItem("supportConversationId");
    }

    setMessages((prev) => [...prev, { sender: "user", content: text, created_at: new Date().toISOString() }]);

    try {
      const res = await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvoId,
          message: text,
          sessionId: getSessionId(),
          forceHuman
        })
      });
      const data = await res.json();
      if (data.conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem("supportConversationId", data.conversationId);
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { sender: "ai", content: data.reply, created_at: new Date().toISOString() }]);
      }
      if (data.escalated) setStatus("waiting_human");
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", content: "Something went wrong sending that — try again?", created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm h-[65vh] max-h-[520px] bg-paper border border-line rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <div className="bg-ink text-paper px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-sm">PeeyashStudy Support</p>
              <p className="text-xs text-paper/60">
                {status === "waiting_human" && "Connecting you to a real person…"}
                {status === "human_active" && "You're chatting with a real team member"}
                {(status === "ai" || !status) && "AI assistant · usually replies instantly"}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-paper/70 hover:text-paper text-lg leading-none">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-ink/50 text-center mt-6">
                Hi{userEmail ? "" : " there"} 👋 Ask me anything about PeeyashStudy — premium, referrals, study rooms, your account, anything.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.sender === "user" ? "bg-biro text-paper" :
                  m.sender === "admin" ? "bg-leaf/15 text-ink border border-leaf/30" :
                  "bg-line/50 text-ink"
                }`}>
                  {m.sender === "admin" && <p className="text-[10px] font-mono uppercase text-leaf mb-0.5">Team</p>}
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {status !== "closed" && (
            <div className="border-t border-line p-3">
              {status === "ai" && (
                <button
                  onClick={() => send(true)}
                  className="text-xs text-biro underline mb-2"
                >
                  Talk to a real person instead
                </button>
              )}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message…"
                  className="flex-1 border border-line rounded-full px-3.5 py-2 text-sm focus-ring"
                />
                <button
                  onClick={() => send()}
                  disabled={sending || !input.trim()}
                  className="bg-ink text-paper rounded-full px-4 text-sm font-medium disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          )}
          {status === "closed" && (
            <div className="border-t border-line p-3 text-center text-xs text-ink/50">
              This conversation was closed. Send a new message to start a fresh one.
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-ink text-paper shadow-lg flex items-center justify-center text-2xl hover:bg-biro transition-colors"
        aria-label="Open support chat"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
