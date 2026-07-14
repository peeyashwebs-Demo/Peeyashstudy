"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

export default function AdminSupportPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(params.get("id") || null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const bottomRef = useRef(null);

  async function loadList() {
    const res = await fetch("/api/admin/support");
    if (res.status === 403) { setUnauthorized(true); return; }
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function loadThread(id) {
    if (!id) return;
    const res = await fetch(`/api/support/messages?conversationId=${id}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadThread(activeId);
    if (!activeId) return;
    const t = setInterval(() => loadThread(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function openConversation(id) {
    setActiveId(id);
    router.replace(`/admin/support?id=${id}`);
  }

  async function sendReply(close = false) {
    if (!activeId || (!reply.trim() && !close) || sending) return;
    setSending(true);
    try {
      await fetch("/api/admin/support/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, message: reply.trim(), close })
      });
      setReply("");
      await loadThread(activeId);
      await loadList();
    } finally {
      setSending(false);
    }
  }

  if (unauthorized) {
    return (
      <>
        <Nav authed />
        <main className="max-w-md mx-auto px-5 py-16 text-center">
          <p className="text-sm text-ink/60">You don't have access to this page.</p>
        </main>
      </>
    );
  }

  const active = conversations.find((c) => c.id === activeId);

  return (
    <>
      <Nav authed />
      <main className="max-w-5xl mx-auto px-5 py-8">
        <Link href="/admin" className="text-sm text-ink/50 hover:text-biro">← Admin</Link>
        <h1 className="font-display text-2xl font-semibold mt-2 mb-6">Support Inbox</h1>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 border border-line rounded-2xl overflow-hidden" style={{ minHeight: "60vh" }}>
          {/* Conversation list */}
          <div className="border-r border-line overflow-y-auto max-h-[70vh]">
            {conversations.length === 0 && (
              <p className="text-sm text-ink/50 p-5 text-center">No conversations yet.</p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-line/60 hover:bg-line/20 ${activeId === c.id ? "bg-line/30" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {c.profiles?.full_name || c.guest_name || "Guest visitor"}
                  </span>
                  {c.status === "waiting_human" && (
                    <span className="text-[10px] font-mono uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">New</span>
                  )}
                  {c.status === "human_active" && (
                    <span className="text-[10px] font-mono uppercase bg-leaf/15 text-leaf px-1.5 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <p className="text-xs text-ink/50">{new Date(c.last_message_at).toLocaleString()}</p>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className="flex flex-col">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-sm text-ink/50">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-line flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {active?.profiles?.full_name || active?.profiles?.email || active?.guest_name || "Guest visitor"}
                  </p>
                  <button onClick={() => sendReply(true)} className="text-xs text-ink/50 hover:text-red-600 underline">
                    Close conversation
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[50vh]">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                        m.sender === "admin" ? "bg-ink text-paper" :
                        m.sender === "ai" ? "bg-line/50 text-ink" :
                        "bg-biro/10 text-ink border border-biro/20"
                      }`}>
                        {m.sender === "ai" && <p className="text-[10px] font-mono uppercase text-ink/40 mb-0.5">AI</p>}
                        {m.sender === "user" && <p className="text-[10px] font-mono uppercase text-biro mb-0.5">Student</p>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="border-t border-line p-3 flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply(false)}
                    placeholder="Reply as PeeyashStudy team…"
                    className="flex-1 border border-line rounded-full px-3.5 py-2 text-sm focus-ring"
                  />
                  <button
                    onClick={() => sendReply(false)}
                    disabled={sending || !reply.trim()}
                    className="bg-ink text-paper rounded-full px-4 text-sm font-medium disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
