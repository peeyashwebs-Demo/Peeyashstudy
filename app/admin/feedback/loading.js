import Nav from "@/components/Nav";
import { Skel, SkelCard } from "@/components/Skeleton";

export default function AdminFeedbackLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <Skel className="h-4 w-20 mb-2" />
        <Skel className="h-7 w-32 mb-8" />

        <div className="grid grid-cols-3 gap-4 mb-8">
          <SkelCard /><SkelCard /><SkelCard />
        </div>

        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3, 4, 5].map((i) => <Skel key={i} className="h-16 flex-1" />)}
        </div>

        <Skel className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          <Skel className="h-20 w-full rounded-xl" />
          <Skel className="h-20 w-full rounded-xl" />
          <Skel className="h-20 w-full rounded-xl" />
        </div>
      </main>
    </>
  );
}
