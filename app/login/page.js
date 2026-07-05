"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justConfirmed = params.get("confirmed") === "true";
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(form);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    router.push("/dashboard");
  }

  return (
    <>
      <Nav authed={false} />
      <main className="max-w-sm mx-auto px-5 py-12 sm:py-16">
        <h1 className="font-display text-2xl font-semibold mb-2">Welcome back</h1>

        {justConfirmed && (
          <div className="bg-leaf/10 border border-leaf/30 text-leaf text-sm rounded-xl px-4 py-3 mb-6">
            Email confirmed. You can log in now.
          </div>
        )}
        {!justConfirmed && <div className="mb-6" />}

        <form onSubmit={onSubmit} className="space-y-4">
          <input required type="email" inputMode="email" autoComplete="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-line rounded-lg px-4 py-3.5 text-base sm:text-sm focus-ring" />
          <input required type="password" autoComplete="current-password" placeholder="Password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-line rounded-lg px-4 py-3.5 text-base sm:text-sm focus-ring" />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={loading} className="w-full bg-ink text-paper rounded-full py-3.5 text-sm font-medium hover:bg-biro active:bg-biro transition-colors focus-ring disabled:opacity-60">
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink/60">No account? <Link href="/signup" className="text-biro underline">Sign up</Link></p>
      </main>
    </>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
