"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import FeedbackButton from "@/components/FeedbackButton";

const icons = {
  Dashboard: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.7"/></svg>,
  Upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4l-5 5M12 4l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Practice: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Wallet: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.7"/><circle cx="16" cy="14" r="1.3" fill="currentColor"/></svg>,
  "Study rooms": (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.7"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M2.5 20c.7-3.5 3-5.5 5.5-5.5s4.8 2 5.5 5.5M14.5 20c.4-2.3 1.7-4 3.5-4.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18 6l-1.5 1.5M7.5 16.5L6 18M18 18l-1.5-1.5M7.5 7.5L6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  "How it works": (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  Integrity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  "Log in": (p) => <svg {...p} viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
};

export default function Nav({ authed }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = authed
    ? [["Dashboard", "/dashboard"], ["Upload", "/upload"], ["Practice", "/practice"], ["Study rooms", "/rooms"], ["Wallet", "/wallet"], ["Settings", "/settings"]]
    : [["How it works", "/#how"], ["Integrity", "/integrity"], ["Log in", "/login"]];

  // Lock background scroll while the mobile panel is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close the panel automatically on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <nav className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight focus-ring rounded">
            Peeyash<span className="text-biro">Study</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`hover:text-biro transition-colors focus-ring rounded ${pathname === href ? "text-biro font-medium" : ""}`}
              >
                {label}
              </Link>
            ))}
            {!authed && (
              <Link href="/signup" className="bg-ink text-paper px-4 py-2 rounded-full text-sm font-medium hover:bg-biro transition-colors focus-ring">
                Get started
              </Link>
            )}
          </div>

          {/* Animated hamburger -> X */}
          <button
            className="md:hidden relative w-10 h-10 -mr-2 flex items-center justify-center focus-ring rounded-lg"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <span
              className="absolute block w-5 h-0.5 bg-ink rounded-full transition-all duration-300"
              style={{ transform: open ? "rotate(45deg)" : "translateY(-4px)" }}
            />
            <span
              className="absolute block w-5 h-0.5 bg-ink rounded-full transition-all duration-300"
              style={{ transform: open ? "rotate(-45deg)" : "translateY(4px)" }}
            />
          </button>
        </nav>
      </header>

      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-down mobile panel */}
      <div
        className={`md:hidden fixed left-0 right-0 top-16 z-30 bg-paper border-b border-line shadow-xl transition-all duration-300 origin-top ${
          open ? "opacity-100 scale-y-100" : "opacity-0 scale-y-95 pointer-events-none"
        }`}
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        <div className="px-3 py-3">
          {links.map(([label, href]) => {
            const Icon = icons[label];
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] transition-colors ${
                  active ? "bg-biro/10 text-biro font-medium" : "text-ink hover:bg-line/50"
                }`}
              >
                {Icon && <Icon className="w-5 h-5 shrink-0" />}
                {label}
              </Link>
            );
          })}
          {!authed && (
            <Link
              href="/signup"
              className="mt-2 flex items-center justify-center gap-2 bg-ink text-paper px-4 py-3.5 rounded-xl text-[15px] font-medium hover:bg-biro transition-colors"
            >
              Get started free
            </Link>
          )}
        </div>
      </div>

      {authed && <FeedbackButton />}
    </>
  );
}
