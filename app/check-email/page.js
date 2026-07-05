"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

function CheckEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") || "your email";

  return (
    <>
      <Nav authed={false} />
      <main className="max-w-md mx-auto px-5 py-16 md:py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-biro/10 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
              stroke="#2547D0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3">Check your inbox</h1>
        <p className="text-ink/70 leading-relaxed mb-1">
          We've sent a confirmation link to
        </p>
        <p className="font-medium mb-6">{email}</p>
        <p className="text-sm text-ink/60 leading-relaxed mb-8">
          Click the link in that email to activate your account. If you don't see it in a
          minute or two, check your Spam or Junk folder — first emails from new senders
          sometimes land there.
        </p>
        <Link href="/login" className="inline-block border border-ink rounded-full px-6 py-3 text-sm font-medium hover:bg-ink hover:text-paper transition-colors">
          Go to log in
        </Link>
      </main>
    </>
  );
}

export default function CheckEmail() {
  return <Suspense><CheckEmailContent /></Suspense>;
}
