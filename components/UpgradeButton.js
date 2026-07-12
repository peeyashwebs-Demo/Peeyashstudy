"use client";
import { useState } from "react";
import Naira from "@/components/Naira";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const res = await fetch("/api/flutterwave/init", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else console.error("Upgrade failed:", data);
  }
  return (
    <button onClick={go} disabled={loading}
      className="w-full bg-biro text-paper py-3 rounded-full text-sm font-medium hover:bg-ink transition-colors mb-6">
      {loading ? "Starting checkout…" : <>Upgrade to Premium — <Naira amount="5,000" />/month</>}
    </button>
  );
}
