import Nav from "@/components/Nav";

export default function Integrity() {
  return (
    <>
      <Nav authed={false} />
      <main className="max-w-2xl mx-auto px-5 py-16">
        <p className="font-mono text-xs uppercase text-biro mb-4">Academic Integrity</p>
        <h1 className="font-display text-3xl font-semibold mb-6">We help you learn. We don't do your work.</h1>
        <div className="space-y-5 text-ink/80 leading-relaxed">
          <p>PeeyashStudy exists to help Nigerian open-university students understand their assignments and course material — not to produce work for them to submit as their own.</p>
          <p>When you upload a TMA, PeeyashStudy breaks the questions down, explains the underlying concepts, and gives you a structure to build your own answer on. It never generates a complete, submittable essay or answer.</p>
          <p>The Draft Review feature reviews writing that you produced yourself. It gives feedback on structure and clarity — it does not rewrite your work for you.</p>
          <p>Using PeeyashStudy to understand material and practice with quizzes is a normal, healthy way to study. Submitting AI-generated writing as your own work violates most university policies, including MIVA's, and we've built the product so it can't be used that way.</p>
        </div>
      </main>
    </>
  );
}
