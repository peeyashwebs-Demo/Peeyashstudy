"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Paystack appends ?trxref=xxx&reference=xxx to the callback URL automatically.
// This silently confirms the payment the moment the user lands back on the dashboard —
// a safety net in case the webhook hasn't fired yet (e.g. webhook URL not yet configured,
// or a delay on Paystack's side).
export default function PaymentVerifier() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState(null); // null | "checking" | "success" | "error"

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    setStatus("checking");
    fetch("/api/paystack/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference })
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.ok ? "success" : "error");
        // clean the URL so a refresh doesn't re-trigger verification
        router.replace("/dashboard");
        if (data.ok) router.refresh();
      })
      .catch(() => setStatus("error"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!status || status === null) return null;

  return (
    <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${
      status === "checking" ? "bg-line/40 text-ink/70" :
      status === "success" ? "bg-leaf/15 text-leaf border border-leaf/30" :
      "bg-red-50 text-red-700 border border-red-200"
    }`}>
      {status === "checking" && "Confirming your payment…"}
      {status === "success" && "Payment confirmed — Premium is now active. 🎉"}
      {status === "error" && "We couldn't confirm that payment yet. If you were charged, it may take a minute — refresh shortly, or contact support."}
    </div>
  );
}
