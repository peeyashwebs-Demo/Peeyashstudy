"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { Skel } from "@/components/Skeleton";

export default function RoomDetail() {
  const { roomId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/rooms/${roomId}/stats`);
      const json = await res.json();
      if (!res.ok) { setErr(json.error); setLoading(false); return; }
      setData(json);
      setLoading(false);
    })();
  }, [roomId]);

  function copyCode() {
    navigator.clipboard.writeText(data.room.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <>
        <Nav authed />
        <main className="max-w-2xl mx-auto px-5 py-10">
          <Skel className="h-7 w-48 mb-6" />
          <Skel className="h-20 w-full rounded-2xl mb-6" />
          <Skel className="h-40 w-full rounded-2xl" />
        </main>
      </>
    );
  }

  if (err) {
    return (
      <>
        <Nav authed />
        <main className="max-w-2xl mx-auto px-5 py-10">
          <p className="text-sm text-red-600">{err}</p>
          <Link href="/rooms" className="text-sm text-biro underline mt-3 inline-block">← Back to rooms</Link>
        </main>
      </>
    );
  }

  const { room, members, weakSpots } = data;
  const maxMiss = Math.max(...weakSpots.map((w) => w.membersStruggling), 1);

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/rooms" className="text-xs text-ink/50 hover:text-biro">← All rooms</Link>
        <h1 className="font-display text-2xl font-semibold mt-1 mb-1">{room.name}</h1>
        <p className="text-sm text-ink/50 mb-6">{room.course_code || "General"} · {members.length} member{members.length === 1 ? "" : "s"}</p>

        <div className="border border-line rounded-2xl p-5 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Invite code</p>
            <p className="font-mono text-lg tracking-widest font-semibold">{room.invite_code}</p>
          </div>
          <button onClick={copyCode} className="bg-ink text-paper px-4 py-2 rounded-full text-sm font-medium hover:bg-biro transition-colors">
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>

        <h2 className="font-display text-lg font-semibold mb-3">Where the group is struggling</h2>
        {weakSpots.length === 0 ? (
          <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">
            No quiz data yet — once members take practice quizzes, weak spots show up here.
          </p>
        ) : (
          <div className="space-y-3 mb-8">
            {weakSpots.map((w, i) => (
              <div key={i} className="border border-line rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">{w.concept}</p>
                  <p className="text-xs text-ink/50">
                    {w.membersStruggling} of {members.length} struggling
                  </p>
                </div>
                <div className="h-2 bg-line rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${(w.membersStruggling / maxMiss) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display text-lg font-semibold mb-3">Members</h2>
        <ul className="border border-line rounded-xl divide-y divide-line overflow-hidden">
          {members.map((m, i) => (
            <li key={i} className="px-4 py-3 text-sm">{m.name}</li>
          ))}
        </ul>
      </main>
    </>
  );
}
