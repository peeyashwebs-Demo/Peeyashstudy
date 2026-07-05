"use client";
import { useState } from "react";

export default function ReferralLink({ link, code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const waText = encodeURIComponent(`I've been using PeeyashStudy to understand my MIVA assignments faster — thought it'd help you too: ${link}`);
  return (
    <div className="border border-line rounded-2xl p-5">
      <p className="text-xs font-mono uppercase text-ink/50 mb-2">Your link</p>
      <div className="flex gap-2">
        <input readOnly value={link} className="flex-1 border border-line rounded-lg px-3 py-2.5 text-sm bg-line/20" />
        <button onClick={copy} className="bg-ink text-paper px-4 rounded-lg text-sm hover:bg-biro transition-colors">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"
        className="mt-3 inline-block bg-leaf text-paper px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
        Share on WhatsApp
      </a>
    </div>
  );
}
