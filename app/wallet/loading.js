import Nav from "@/components/Nav";
import { Skel, SkelRow } from "@/components/Skeleton";

export default function WalletLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <Skel className="h-7 w-32 mb-6" />

        <div className="bg-ink/90 rounded-2xl p-6 mb-6">
          <Skel className="h-3 w-16 mb-3 bg-paper/20" />
          <Skel className="h-10 w-40 mb-2 bg-paper/20" />
          <Skel className="h-3 w-24 bg-paper/20" />
        </div>

        <Skel className="h-12 w-full rounded-full mb-6" />

        <div className="border border-line rounded-2xl p-5">
          <Skel className="h-4 w-48 mb-3" />
          <div className="grid grid-cols-2 gap-3">
            <Skel className="h-10 rounded-lg" />
            <Skel className="h-10 rounded-lg" />
            <Skel className="h-10 rounded-lg" />
            <Skel className="h-10 rounded-lg" />
          </div>
        </div>

        <div className="mt-10">
          <Skel className="h-5 w-24 mb-3" />
          <div className="border border-line rounded-xl divide-y divide-line overflow-hidden">
            <SkelRow /><SkelRow /><SkelRow /><SkelRow />
          </div>
        </div>
      </main>
    </>
  );
}
