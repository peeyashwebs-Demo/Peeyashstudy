import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import PaymentVerifier from "@/components/PaymentVerifier";
import { isPremium } from "@/lib/usage";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const { data: wallet } = await admin.from("wallets").select("*").eq("user_id", user.id).single();
  const { data: uploads } = await admin
    .from("uploads").select("original_name, created_at").eq("user_id", user.id)
    .order("created_at", { ascending: false }).limit(5);
  const { count: paidRefs } = await admin
    .from("referrals").select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id).eq("status", "credited");

  const premium = isPremium(profile);

  return (
    <>
      <Nav authed />
      <main className="max-w-4xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold">Welcome back, {profile?.full_name?.split(" ")[0] || "there"}</h1>
        <p className="text-ink/60 text-sm mt-1">{profile?.school} · {premium ? "Premium" : "Free plan"}</p>

        <div className="mt-5">
          <Suspense fallback={null}>
            <PaymentVerifier />
          </Suspense>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link href="/wallet" className="border border-line rounded-2xl p-5 hover:border-biro transition-colors">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Wallet</p>
            <p className="font-display text-2xl font-semibold">₦{((wallet?.balance_kobo || 0) / 100).toLocaleString()}</p>
          </Link>
          <div className="border border-line rounded-2xl p-5">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Paid referrals</p>
            <p className="font-display text-2xl font-semibold">{paidRefs || 0} / 5</p>
          </div>
          <div className="border border-line rounded-2xl p-5">
            <p className="text-xs font-mono uppercase text-ink/50 mb-1">Plan</p>
            <p className="font-display text-2xl font-semibold">{premium ? "Premium" : "Free"}</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/upload" className="bg-ink text-paper px-5 py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors">Upload an assignment</Link>
          <Link href="/worked-example" className="border border-line px-5 py-3 rounded-full text-sm font-medium hover:border-biro transition-colors">Worked example</Link>
          <Link href="/practice" className="border border-line px-5 py-3 rounded-full text-sm font-medium hover:border-biro transition-colors">Practice quiz</Link>
          <Link href="/refer" className="border border-line px-5 py-3 rounded-full text-sm font-medium hover:border-biro transition-colors">Invite &amp; earn</Link>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold mb-3">Recent uploads</h2>
          {uploads?.length ? (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
              {uploads.map((u, i) => (
                <li key={i} className="px-4 py-3 text-sm flex justify-between">
                  <span>{u.original_name}</span>
                  <span className="text-ink/40 font-mono text-xs">{new Date(u.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/50 border border-dashed border-line rounded-xl px-4 py-8 text-center">
              Nothing uploaded yet. Your first breakdown takes about 30 seconds.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
