import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import ReferralLink from "@/components/ReferralLink";
import Naira from "@/components/Naira";

export default async function Refer() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("referral_code").eq("id", user.id).single();
  const { count: credited } = await admin.from("referrals").select("*", { count: "exact", head: true }).eq("referrer_id", user.id).eq("status", "credited");

  const link = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${profile.referral_code}`;
  const progress = Math.min(((credited || 0) / 5) * 100, 100);

  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-2">Invite & earn</h1>
        <p className="text-sm text-ink/60 mb-6"><Naira amount="1,500" /> lands in your wallet the moment someone you invite subscribes. Five paid invites covers your own month.</p>

        <ReferralLink link={link} code={profile.referral_code} />

        <div className="mt-8">
          <div className="flex justify-between text-sm font-mono text-ink/50 mb-2">
            <span>Paid referrals</span><span>{credited || 0} / 5</span>
          </div>
          <div className="h-3 bg-line rounded-full overflow-hidden">
            <div className="h-full bg-biro rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </main>
    </>
  );
}
