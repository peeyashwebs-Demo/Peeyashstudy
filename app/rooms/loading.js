import Nav from "@/components/Nav";
import { Skel } from "@/components/Skeleton";

export default function RoomsLoading() {
  return (
    <>
      <Nav authed />
      <main className="max-w-2xl mx-auto px-5 py-10">
        <Skel className="h-7 w-40 mb-2" />
        <Skel className="h-4 w-full max-w-md mb-6" />
        <div className="flex gap-2 mb-6">
          <Skel className="h-12 flex-1 rounded-full" />
          <Skel className="h-12 flex-1 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skel className="h-16 w-full rounded-xl" />
          <Skel className="h-16 w-full rounded-xl" />
        </div>
      </main>
    </>
  );
}
