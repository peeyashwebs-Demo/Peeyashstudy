"use client";
import { useState } from "react";

export default function WithdrawForm({ balanceKobo }) {
  const [form, setForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const res = await fetch("/api/withdraw", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountKobo: Math.round(Number(form.amount) * 100),
        bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName
      })
    });
    const data = await res.json();
    setLoading(false);
    setMsg(res.ok ? "Withdrawal requested. You'll receive it within 24 hours." : data.error);
  }

  return (
    <form onSubmit={submit} className="border border-line rounded-2xl p-5">
      <p className="font-medium mb-3 text-sm">Withdraw to bank or OPay</p>
      <p className="text-xs text-ink/50 mb-3">Minimum ₦5,000 · Available: ₦{(balanceKobo / 100).toLocaleString()}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input required type="number" placeholder="Amount (₦)" value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="border border-line rounded-lg px-3 py-2.5 text-sm focus-ring" />
        <input required placeholder="Bank / OPay" value={form.bankName}
          onChange={(e) => setForm({ ...form, bankName: e.target.value })}
          className="border border-line rounded-lg px-3 py-2.5 text-sm focus-ring" />
        <input required placeholder="Account number" value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          className="border border-line rounded-lg px-3 py-2.5 text-sm focus-ring" />
        <input required placeholder="Account name" value={form.accountName}
          onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          className="border border-line rounded-lg px-3 py-2.5 text-sm focus-ring" />
      </div>
      <button disabled={loading} className="bg-ink text-paper px-5 py-2.5 rounded-full text-sm font-medium hover:bg-biro transition-colors">
        {loading ? "Requesting…" : "Request withdrawal"}
      </button>
      {msg && <p className="text-sm mt-3 text-ink/70">{msg}</p>}
    </form>
  );
}
