"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PREMIUM_COST_KOBO = 500000; // ₦5,000

export default function RenewFromWalletButton({ balanceKobo, alreadyPremium }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const ready = balanceKobo >= PREMIUM_COST_KOBO;
  const shortfall = Math.max(PREMIUM_COST_KOBO - balanceKobo, 0) / 100;

  async function renew() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/wallet/renew", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMsg(data.error); return; }
    setMsg(alreadyPremium ? "Premium extended by 30 more days. 🎉" : "Premium activated. 🎉");
    router.refresh();
  }

  return (
    <div className="border border-line rounded-2xl p-5 mb-6">
      <p className="font-medium text-sm mb-1">
        {alreadyPremium ? "Extend Premium using your wallet" : "Activate Premium using your wallet"}
      </p>
      <p className="text-xs text-ink/50 mb-3">
        {ready
          ? "You have enough to cover a full month — no card needed."
          : `₦${shortfall.toLocaleString()} more needed to cover a month (₦5,000 total).`}
      </p>

      <button
        onClick={renew}
        disabled={!ready || loading}
        className={`w-full py-3 rounded-full text-sm font-medium transition-colors ${
          ready
            ? "bg-leaf text-paper hover:opacity-90"
            : "bg-line text-ink/40 cursor-not-allowed"
        }`}
      >
        {loading ? "Activating…" : ready ? "Use ₦5,000 from wallet — activate now" : "Not enough balance yet"}
      </button>

      {!ready && (
        <div className="h-1.5 bg-line rounded-full overflow-hidden mt-3">
          <div className="h-full bg-biro rounded-full" style={{ width: `${Math.min((balanceKobo / PREMIUM_COST_KOBO) * 100, 100)}%` }} />
        </div>
      )}

      {msg && <p className="text-sm text-ink/70 mt-3">{msg}</p>}
    </div>
  );
}
