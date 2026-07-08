"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [createForm, setCreateForm] = useState({ name: "", courseCode: "" });
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("room_members")
      .select("study_rooms(id, name, course_code, invite_code)")
      .eq("user_id", user.id);
    setRooms((data || []).map((r) => r.study_rooms).filter(Boolean));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createRoom(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/rooms/create", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: createForm.name, courseCode: createForm.courseCode })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setMode(null); setCreateForm({ name: "", courseCode: "" });
    load();
  }

  async function joinRoom(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/rooms/join", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode })
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error); return; }
    setMode(null); setJoinCode("");
    load();
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Study rooms</h1>
        <p className="text-sm text-ink/60 mb-1">
          Pool quiz results with your course mates and see which concepts the group keeps missing.
        </p>
        <p className="text-xs text-ink/40 mb-6">Free plan: 1 room · Premium: unlimited</p>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode(mode === "create" ? null : "create")}
            className="flex-1 bg-ink text-paper py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors">
            Create a room
          </button>
          <button onClick={() => setMode(mode === "join" ? null : "join")}
            className="flex-1 border border-line py-3 rounded-full text-sm font-medium hover:border-biro transition-colors">
            Join with a code
          </button>
        </div>

        {mode === "create" && (
          <form onSubmit={createRoom} className="border border-line rounded-2xl p-4 mb-6 space-y-2">
            <input required placeholder="Room name (e.g. MCM102 Squad)" value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm focus-ring" />
            <input placeholder="Course code (optional)" value={createForm.courseCode}
              onChange={(e) => setCreateForm({ ...createForm, courseCode: e.target.value })}
              className="w-full border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm focus-ring" />
            <button disabled={busy} className="bg-ink text-paper px-5 py-2.5 rounded-full text-sm font-medium hover:bg-biro transition-colors">
              {busy ? "Creating…" : "Create room"}
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={joinRoom} className="border border-line rounded-2xl p-4 mb-6 flex gap-2">
            <input required placeholder="6-character invite code" value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 border border-line rounded-lg px-3 py-2.5 text-base sm:text-sm font-mono tracking-widest focus-ring" />
            <button disabled={busy} className="bg-ink text-paper px-5 rounded-lg text-sm font-medium hover:bg-biro transition-colors">
              {busy ? "…" : "Join"}
            </button>
          </form>
        )}
        {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

        {loading ? (
          <div className="space-y-2">
            <Skel className="h-16 w-full rounded-xl" />
            <Skel className="h-16 w-full rounded-xl" />
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl p-6 text-center">
            No rooms yet — create one or join with a friend's code.
          </p>
        ) : (
          <ul className="space-y-2">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link href={`/rooms/${r.id}`}
                  className="block border border-line rounded-xl p-4 hover:border-biro transition-colors">
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {r.course_code ? `${r.course_code} · ` : ""}Code: <span className="font-mono">{r.invite_code}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
