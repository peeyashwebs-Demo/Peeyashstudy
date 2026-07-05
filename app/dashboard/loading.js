import Nav from "@/components/Nav";
import { Skel, SkelCard, SkelRow } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-4xl mx-auto px-5 py-10">
        <Skel className="h-7 w-56 mb-2" />
        <Skel className="h-4 w-32 mb-8" />

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <SkelCard /><SkelCard /><SkelCard />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Skel className="h-11 w-44 rounded-full" />
          <Skel className="h-11 w-36 rounded-full" />
          <Skel className="h-11 w-32 rounded-full" />
        </div>

        <div className="mt-10">
          <Skel className="h-5 w-40 mb-3" />
          <div className="border border-line rounded-xl divide-y divide-line overflow-hidden">
            <SkelRow /><SkelRow /><SkelRow />
          </div>
        </div>
      </main>
    </>
  );
}
