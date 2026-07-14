"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const QUICK_QUESTIONS = [
  "How much is Premium?",
  "How does the referral program work?",
  "How do I create a study room?",
  "I want to talk to a real person"
];

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("supportSessionId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("supportSessionId", id);
  }
  return id;
}

export default function SupportFAB() {
  const [view, setView] = useState("closed"); // closed | menu | chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("ai");
  const [conversationId, setConversationId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const menuRef = useRef(null);
  const lastTypingPingRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data?.user?.email || null));
    const savedConvo = localStorage.getItem("supportConversationId");
    if (savedConvo) setConversationId(savedConvo);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view, adminTyping]);

  // Close the popup menu on an outside click/tap
  useEffect(() => {
    if (view !== "menu") return;
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setView("closed");
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, [view]);

  useEffect(() => {
    if (view !== "chat" || !conversationId) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/support/messages?conversationId=${conversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
        if (data.status) setStatus(data.status);
        setAdminTyping(!!data.adminTypingAt && Date.now() - new Date(data.adminTypingAt).getTime() < 3000);
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [view, conversationId]);

  function handleInputChange(e) {
    setInput(e.target.value);
    if (!conversationId) return;
    const now = Date.now();
    // Only ping at most once every 2s to avoid spamming the server on every keystroke
    if (now - lastTypingPingRef.current > 2000) {
      lastTypingPingRef.current = now;
      fetch("/api/support/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, as: "user" })
      }).catch(() => {});
    }
  }

  async function send(overrideText) {
    const raw = overrideText ?? input;
    const text = raw.trim();
    const forceHuman = text.toLowerCase().includes("talk to a real person") || text.toLowerCase().includes("real human");
    if (!text || sending) return;

    setSending(true);
    setInput("");

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
        body: JSON.stringify({ conversationId: activeConvoId, message: text, sessionId: getSessionId(), forceHuman })
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("bad_response");
      }

      if (!res.ok || data.error) {
        setMessages((prev) => [...prev, {
          sender: "ai",
          content: "Sorry — support isn't fully set up yet on this site. Please try again in a bit, or reach out another way for now.",
          created_at: new Date().toISOString()
        }]);
        console.error("Support error:", data.error || res.status);
        return;
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem("supportConversationId", data.conversationId);
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { sender: "ai", content: data.reply, created_at: new Date().toISOString() }]);
      }
      if (data.escalated) setStatus("waiting_human");
    } catch {
      setMessages((prev) => [...prev, {
        sender: "ai",
        content: "Something went wrong sending that — check your connection and try again.",
        created_at: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* CHAT PANEL */}
      {view === "chat" && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-5 z-50 sm:w-[380px] sm:h-[600px] sm:max-h-[75vh] bg-paper sm:border sm:border-line sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-ink text-paper px-4 py-3.5 flex items-center justify-between shrink-0" style={{ paddingTop: "max(0.875rem, env(safe-area-inset-top))" }}>
            <div>
              <p className="font-display font-semibold text-sm">PeeyashStudy Support</p>
              <p className="text-xs text-paper/60">
                {status === "waiting_human" && "Connecting you to a real person…"}
                {status === "human_active" && "You're chatting with a real team member"}
                {(status === "ai" || !status) && "AI assistant · usually replies instantly"}
              </p>
            </div>
            <button onClick={() => setView("closed")} className="text-paper/70 hover:text-paper text-xl leading-none w-8 h-8 flex items-center justify-center -mr-1.5" aria-label="Close support chat">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="mt-4">
                <p className="text-sm text-ink/60 text-center mb-5">
                  Hi{userEmail ? "" : " there"} 👋 Ask me anything about PeeyashStudy.
                </p>
                <div className="flex flex-col gap-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="text-left text-sm border border-line rounded-xl px-3.5 py-2.5 hover:bg-line/20 hover:border-biro/40 transition-colors">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
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
            {sending && (
              <div className="flex justify-start">
                <div className="bg-line/50 text-ink/50 rounded-2xl px-3.5 py-2 text-sm">…</div>
              </div>
            )}
            {adminTyping && !sending && (
              <div className="flex justify-start">
                <div className="bg-leaf/15 text-leaf border border-leaf/30 rounded-2xl px-3.5 py-2 text-sm flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase">Team is typing</span>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {status !== "closed" && (
            <div className="border-t border-line p-3 shrink-0" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {status === "ai" && messages.length > 0 && (
                <button onClick={() => send("I'd like to talk to a real person, please.")} className="text-xs text-biro underline mb-2 block">
                  Talk to a real person instead
                </button>
              )}
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Type a message…"
                  className="flex-1 border border-line rounded-full px-3.5 py-2.5 text-sm focus-ring min-w-0"
                />
                <button onClick={() => send()} disabled={sending || !input.trim()}
                  className="bg-ink text-paper rounded-full px-4 text-sm font-medium disabled:opacity-40 shrink-0">
                  Send
                </button>
              </div>
            </div>
          )}
          {status === "closed" && (
            <div className="border-t border-line p-3 text-center text-xs text-ink/50 shrink-0">
              This conversation was closed. Send a new message to start a fresh one.
            </div>
          )}
        </div>
      )}

      {/* POPUP MENU */}
      {view === "menu" && (
        <div
          ref={menuRef}
          className="fixed bottom-[5.75rem] right-5 z-50 bg-paper border border-line rounded-2xl shadow-xl overflow-hidden w-56"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            onClick={() => setView("chat")}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-line/20 transition-colors text-left border-b border-line"
          >
            <span className="text-lg">💬</span> Chat with us
          </button>
          {userEmail && (
            <Link
              href="/feedback"
              onClick={() => setView("closed")}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium hover:bg-line/20 transition-colors text-left"
            >
              <FeedbackIcon /> Give feedback
            </Link>
          )}
        </div>
      )}

      {/* SINGLE FAB — hidden while the chat panel is open, since the panel has its own close button */}
      {view !== "chat" && (
        <button
          onClick={() => setView((v) => (v === "closed" ? "menu" : "closed"))}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-ink text-paper shadow-lg flex items-center justify-center hover:bg-biro transition-colors"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          aria-label={view === "closed" ? "Open help menu" : "Close"}
        >
          {view === "closed" ? <HelpIcon /> : <span className="text-2xl leading-none">✕</span>}
        </button>
      )}
    </>
  );
}

function HelpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-0.5 items-center">
      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
