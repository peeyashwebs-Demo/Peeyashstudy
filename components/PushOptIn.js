"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushOptIn() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  async function enable() {
    setLoading(true); setMsg("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMsg("Notifications were blocked. You can enable them in your browser settings.");
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      });
      await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub)
      });
      setSubscribed(true);
      setMsg("Notifications turned on.");
    } catch {
      setMsg("Couldn't enable notifications. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg("Notifications turned off.");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="border border-line rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Push notifications</p>
          <p className="text-xs text-ink/50 mt-0.5">Deadline reminders, referral bonuses, and room activity.</p>
        </div>
        <button
          onClick={subscribed ? disable : enable}
          disabled={loading}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            subscribed ? "border border-line hover:border-red-300 hover:text-red-600" : "bg-ink text-paper hover:bg-biro"
          }`}
        >
          {loading ? "…" : subscribed ? "Turn off" : "Turn on"}
        </button>
      </div>
      {msg && <p className="text-xs text-ink/50 mt-2">{msg}</p>}
    </div>
  );
}
