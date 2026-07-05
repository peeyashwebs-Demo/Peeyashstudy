"use client";
import Link from "next/link";
import { useState } from "react";
import FeedbackButton from "@/components/FeedbackButton";

export default function Nav({ authed }) {
  const [open, setOpen] = useState(false);
  const links = authed
    ? [["Dashboard", "/dashboard"], ["Upload", "/upload"], ["Practice", "/practice"], ["Wallet", "/wallet"]]
    : [["How it works", "/#how"], ["Integrity", "/integrity"], ["Log in", "/login"]];
  return (
    <>
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <nav className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Peeyash<span className="text-biro">Study</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-biro transition-colors focus-ring rounded">{label}</Link>
          ))}
          {!authed && (
            <Link href="/signup" className="bg-ink text-paper px-4 py-2 rounded-full text-sm font-medium hover:bg-biro transition-colors focus-ring">
              Get started
            </Link>
          )}
        </div>
        <button className="md:hidden focus-ring rounded-lg p-2.5 -mr-2.5" onClick={() => setOpen(!open)} aria-label="Menu">
          <span className="block w-6 h-0.5 bg-ink mb-1.5" />
          <span className="block w-6 h-0.5 bg-ink" />
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-line px-5 py-4 flex flex-col gap-3 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          {!authed && <Link href="/signup" className="font-medium text-biro">Get started →</Link>}
        </div>
      )}
    </header>
    {authed && <FeedbackButton />}
    </>
  );
}
