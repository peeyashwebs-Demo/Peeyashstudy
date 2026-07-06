import Link from "next/link";
import Nav from "@/components/Nav";
import Naira from "@/components/Naira";

export default function Home() {
  return (
    <>
      <Nav authed={false} />
      <main>
        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 sm:px-5 pt-14 pb-16 md:pt-24 md:pb-28">
          <p className="font-mono text-xs tracking-widest uppercase text-biro mb-5">For MIVA &amp; NOUN students</p>
          <h1 className="font-display text-[2.15rem] leading-[1.2] md:text-6xl md:leading-[1.05] font-semibold max-w-3xl">
            Your TMA lands in your inbox.<br />Understanding it shouldn't take a week.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-ink/70 max-w-xl leading-relaxed">
            Upload the PDF. PeeyashStudy breaks down exactly what each question is asking,
            teaches you the concepts, drills you with a quiz, and reviews the answer <em>you</em> write —
            in about the time it takes to finish a plate of rice.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <Link href="/signup" className="bg-ink text-paper px-7 py-3.5 rounded-full font-medium text-center hover:bg-biro transition-colors focus-ring">
              Start free — 3 uploads/month
            </Link>
            <Link href="/integrity" className="text-sm underline decoration-line underline-offset-4 hover:text-biro">
              Read our academic integrity policy
            </Link>
          </div>
        </section>

        {/* WHAT IT ACTUALLY DOES */}
        <section id="how" className="border-t border-line bg-ink text-paper">
          <div className="max-w-5xl mx-auto px-5 py-16 md:py-20">
            <p className="font-mono text-xs tracking-widest uppercase text-high mb-4">What happens to your PDF</p>
            <div className="grid md:grid-cols-4 gap-8 mt-8">
              {[
                ["Decode", "Every question, unpacked: what it's really asking, the concepts behind it, a structure to build your own answer on."],
                ["Explain", "Ask anything against your own course material — get answers in plain English, not lecturer-speak."],
                ["Drill", "A quiz generated from the same material, so it sticks before the exam, not the night before."],
                ["Review", "Write your own answer, and get honest feedback on structure and clarity — before you submit."]
              ].map(([t, d], i) => (
                <div key={t} className="border-t border-paper/20 pt-5">
                  <span className="font-mono text-xs text-paper/50">0{i + 1}</span>
                  <h3 className="font-display text-xl mt-2 mb-2">{t}</h3>
                  <p className="text-sm text-paper/70 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-paper/60 max-w-xl">
              We never generate a submittable essay. That's not a limitation — it's the whole point.
              An assignment-mill helps you pass a TMA and fail the exam. We do the opposite.
            </p>
          </div>
        </section>

        {/* REFERRAL */}
        <section className="max-w-5xl mx-auto px-5 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-biro mb-4">Refer your course group</p>
              <h2 className="font-display text-3xl font-semibold mb-4">Five paid referrals covers your subscription.</h2>
              <p className="text-ink/70 leading-relaxed">
                Share your link. When someone you invite subscribes, <Naira amount="1,500" /> lands in your wallet.
                Hit five and you've covered a full month — auto-renew it, or withdraw straight to
                your bank or OPay.
              </p>
            </div>
            <div className="bg-white border border-line rounded-2xl p-6">
              <div className="flex justify-between text-sm font-mono text-ink/50 mb-2">
                <span>Referrals</span><span>3 / 5</span>
              </div>
              <div className="h-2 bg-line rounded-full overflow-hidden">
                <div className="h-full bg-biro rounded-full" style={{ width: "60%" }} />
              </div>
              <p className="mt-4 text-sm text-ink/60"><Naira amount="4,500" /> earned this month</p>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="border-t border-line">
          <div className="max-w-5xl mx-auto px-6 sm:px-5 py-14 md:py-20 grid md:grid-cols-2 gap-5 md:gap-6">
            <div className="border border-line rounded-2xl p-6 sm:p-7">
              <p className="font-mono text-xs uppercase text-ink/50 mb-2">Free</p>
              <p className="font-display text-3xl font-semibold mb-5"><Naira amount={0} /></p>
              <ul className="text-sm text-ink/70 space-y-3 mb-7 leading-relaxed">
                <li>3 assignment breakdowns / month</li>
                <li>2 quizzes / month</li>
                <li>5 chat messages / day</li>
              </ul>
              <Link href="/signup" className="block text-center border border-ink rounded-full py-3 text-sm font-medium hover:bg-ink hover:text-paper transition-colors">Start free</Link>
            </div>
            <div className="border-2 border-ink rounded-2xl p-6 sm:p-7 bg-ink text-paper relative overflow-hidden">
              <p className="font-mono text-xs uppercase text-high mb-2">Premium</p>
              <p className="font-display text-3xl font-semibold mb-5"><Naira amount="5,000" /><span className="text-base font-normal text-paper/60">/month</span></p>
              <ul className="text-sm text-paper/80 space-y-3 mb-7 leading-relaxed">
                <li>Unlimited breakdowns &amp; quizzes</li>
                <li>Unlimited course chat</li>
                <li>Draft review</li>
                <li>Or pay <Naira amount={0} /> — cover it with 5 referrals</li>
              </ul>
              <Link href="/signup" className="block text-center bg-paper text-ink rounded-full py-3 text-sm font-medium hover:bg-high transition-colors">Go premium</Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-line py-10 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <p className="text-sm text-ink/60 leading-relaxed">
              PeeyashStudy — a Peeyashwebs product
            </p>
            <span className="hidden sm:inline text-ink/30">·</span>
            <Link href="/integrity" className="text-sm text-ink/60 underline decoration-line underline-offset-4 hover:text-biro transition-colors">
              Academic Integrity
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
