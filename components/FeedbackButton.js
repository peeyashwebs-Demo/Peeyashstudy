"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FeedbackButton() {
  const pathname = usePathname();
  if (pathname === "/feedback") return null; // don't show the button on the feedback page itself

  return (
    <Link
      href="/feedback"
      aria-label="Give feedback"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-ink text-paper pl-3.5 pr-4 py-3 rounded-full shadow-lg shadow-ink/20 hover:bg-biro transition-colors focus-ring group"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm font-medium hidden sm:inline">Feedback</span>
    </Link>
  );
}
