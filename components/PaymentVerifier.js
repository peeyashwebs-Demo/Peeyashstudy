"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Flutterwave appends ?status=successful&tx_ref=xxx&transaction_id=xxx to the
// redirect URL automatically. This silently confirms the payment the moment the
// user lands back on the dashboard. As a further safety net — for cases where the
// user reloads, closes the tab, or never lands back on the redirect URL at all —
// this also checks localStorage for a pending reference stored right before
// checkout, so the payment gets confirmed the next time they simply open the
// dashboard normally. This does NOT depend on the webhook firing.
export default function PaymentVerifier() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState(null); // null | "checking" | "success" | "error"

  useEffect(() => {
    let reference = params.get("tx_ref");
    const flwStatus = params.get("status");
    const fromUrl = !!reference;

    // Flutterwave can redirect back with status=cancelled if the user backs out
    if (fromUrl && flwStatus === "cancelled") {
      localStorage.removeItem("pendingPaymentRef");
      router.replace("/dashboard");
      return;
    }

    // No reference in the URL (e.g. user reloaded or came back later) —
    // fall back to whatever we stored right before they went to checkout.
    if (!reference) {
      reference = localStorage.getItem("pendingPaymentRef");
    }
    if (!reference) return;

    setStatus("checking");
    fetch("/api/flutterwave/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          localStorage.removeItem("pendingPaymentRef");
          if (fromUrl) router.replace("/dashboard");
          router.refresh();
        } else if (fromUrl) {
          setStatus("error");
          router.replace("/dashboard");
        } else {
          // silent background retry from a stored reference — don't nag the
          // user on every dashboard visit if it's genuinely still pending
          setStatus(null);
        }
      })
      .catch(() => { if (fromUrl) setStatus("error"); });
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
