import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import WithdrawForm from "@/components/WithdrawForm";
import UpgradeButton from "@/components/UpgradeButton";
import { isPremium } from "@/lib/usage";

export default async function Wallet() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).single();
  const { data: wallet } = await admin.from("wallets").select("*").eq("user_id", user.id).single();
  const { data: txns } = await admin.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15);

  const naira = (wallet?.balance_kobo || 0) / 100;

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-6">Wallet</h1>

        <div className="bg-ink text-paper rounded-2xl p-6 mb-6">
          <p className="text-xs font-mono uppercase text-paper/60">Balance</p>
          <p className="font-display text-4xl font-semibold mt-1">₦{naira.toLocaleString()}</p>
          <p className="text-sm text-paper/60 mt-2">{isPremium(profile) ? "Premium active" : "Free plan"}</p>
        </div>

        {!isPremium(profile) && <UpgradeButton />}

        <WithdrawForm balanceKobo={wallet?.balance_kobo || 0} />

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold mb-3">History</h2>
          {txns?.length ? (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden">
              {txns.map((t) => (
                <li key={t.id} className="px-4 py-3 text-sm flex justify-between">
                  <span className="capitalize">{t.type.replaceAll("_", " ")}</span>
                  <span className={t.amount_kobo >= 0 ? "text-leaf" : "text-ink/60"}>
                    {t.amount_kobo >= 0 ? "+" : ""}₦{(t.amount_kobo / 100).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink/50">No transactions yet.</p>}
        </div>
      </main>
    </>
  );
}
