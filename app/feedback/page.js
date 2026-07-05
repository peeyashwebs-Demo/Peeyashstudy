"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

export default function Feedback() {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("feedback").insert({ user_id: user.id, rating, message });
    setSent(true);
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-lg mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-6">Feedback</h1>
        {sent ? (
          <p className="text-leaf">Thanks — this genuinely shapes what we build next.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}
                  className={`w-10 h-10 rounded-full border text-sm ${rating >= n ? "bg-high border-high" : "border-line"}`}>
                  {n}
                </button>
              ))}
            </div>
            <textarea required rows={5} placeholder="What's working? What's frustrating?" value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-line rounded-xl px-4 py-3 text-sm focus-ring" />
            <button className="bg-ink text-paper px-6 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors">Send feedback</button>
          </form>
        )}
      </main>
    </>
  );
}
