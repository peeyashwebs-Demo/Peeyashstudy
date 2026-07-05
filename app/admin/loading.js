import Nav from "@/components/Nav";
import { Skel, SkelRow } from "@/components/Skeleton";

export default function AdminLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-3xl mx-auto px-5 py-10">
        <Skel className="h-7 w-28 mb-8" />

        <Skel className="h-5 w-44 mb-3" />
        <div className="space-y-3 mb-10">
          <div className="border border-line rounded-xl p-4">
            <Skel className="h-4 w-32 mb-2" />
            <Skel className="h-3 w-56 mb-3" />
            <Skel className="h-7 w-32 rounded-full" />
          </div>
        </div>

        <Skel className="h-5 w-64 mb-3" />
        <div className="border border-line rounded-xl divide-y divide-line mb-10">
          <SkelRow /><SkelRow /><SkelRow />
        </div>

        <Skel className="h-5 w-24 mb-3" />
        <Skel className="h-16 w-full rounded-xl" />
      </main>
    </>
  );
}
