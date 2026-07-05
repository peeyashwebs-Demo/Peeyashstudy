// Reusable skeleton building blocks. Uses a soft pulse animation so loading
// states feel like "content is arriving" rather than a jarring blank flash.

export function Skel({ className = "" }) {
  return <div className={`animate-pulse bg-line/70 rounded-lg ${className}`} />;
}

export function SkelText({ width = "w-full", className = "" }) {
  return <Skel className={`h-4 ${width} ${className}`} />;
}

export function SkelCard({ className = "" }) {
  return (
    <div className={`border border-line rounded-2xl p-5 ${className}`}>
      <Skel className="h-3 w-20 mb-3" />
      <Skel className="h-7 w-24" />
    </div>
  );
}

export function SkelRow() {
  return (
    <div className="px-4 py-3 flex justify-between items-center">
      <Skel className="h-4 w-40" />
      <Skel className="h-3 w-16" />
    </div>
  );
}
