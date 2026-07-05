"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayoutButtons({ withdrawalId }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function act(action) {
    setLoading(true);
    await fetch("/api/admin/payout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId, action })
    });
    setLoading(false);
    router.refresh();
  }
  return (
    <div className="flex gap-2">
      <button disabled={loading} onClick={() => act("paid")} className="bg-leaf text-paper px-4 py-1.5 rounded-full text-xs font-medium">Mark paid</button>
      <button disabled={loading} onClick={() => act("rejected")} className="border border-line px-4 py-1.5 rounded-full text-xs font-medium">Reject</button>
    </div>
  );
}
