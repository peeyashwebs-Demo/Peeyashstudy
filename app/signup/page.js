"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Nav from "@/components/Nav";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, ref },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setLoading(false);
    if (error) {
      console.error("Signup error:", error); // full detail in console for debugging
      setErr(error.message || "Something went wrong. Please try again.");
      return;
    }
    router.push(`/check-email?email=${encodeURIComponent(form.email)}`);
  }

  return (
    <>
      <Nav authed={false} />
      <main className="max-w-sm mx-auto px-5 py-12 sm:py-16">
        <h1 className="font-display text-2xl font-semibold mb-1">Create your account</h1>
        {ref && <p className="text-sm text-biro mb-6">Invited with code {ref} ✓</p>}
        {!ref && <p className="text-sm text-ink/50 mb-6">Free to start, no card needed.</p>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input required autoComplete="name" placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-line rounded-lg px-4 py-3.5 text-base sm:text-sm focus-ring" />
          <input required type="email" inputMode="email" autoComplete="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-line rounded-lg px-4 py-3.5 text-base sm:text-sm focus-ring" />
          <input required type="password" autoComplete="new-password" minLength={6} placeholder="Password (6+ characters)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-line rounded-lg px-4 py-3.5 text-base sm:text-sm focus-ring" />
          {err && typeof err === "string" && err.trim() !== "{}" && (
            <p className="text-sm text-red-600">{err}</p>
          )}
          <button disabled={loading} className="w-full bg-ink text-paper rounded-full py-3.5 text-sm font-medium hover:bg-biro active:bg-biro transition-colors focus-ring disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-ink/60">Already have an account? <Link href="/login" className="text-biro underline">Log in</Link></p>
      </main>
    </>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
