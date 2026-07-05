import Nav from "@/components/Nav";
import { Skel } from "@/components/Skeleton";

export default function ReferLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <Skel className="h-7 w-48 mb-2" />
        <Skel className="h-4 w-full max-w-md mb-6" />

        <div className="border border-line rounded-2xl p-5">
          <Skel className="h-3 w-20 mb-2" />
          <div className="flex gap-2">
            <Skel className="h-11 flex-1 rounded-lg" />
            <Skel className="h-11 w-20 rounded-lg" />
          </div>
          <Skel className="h-9 w-40 rounded-full mt-3" />
        </div>

        <div className="mt-8">
          <Skel className="h-4 w-32 mb-2" />
          <Skel className="h-3 w-full rounded-full" />
        </div>
      </main>
    </>
  );
}
