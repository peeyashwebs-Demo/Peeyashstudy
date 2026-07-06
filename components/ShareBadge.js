"use client";
import { useRef, useState } from "react";

export default function ShareBadge({ headline, subtext }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  async function getBlob() {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { backgroundColor: null, scale: 3 });
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function download() {
    setGenerating(true);
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "peeyashstudy-win.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  async function share() {
    setGenerating(true);
    try {
      const blob = await getBlob();
      const file = new File([blob], "peeyashstudy-win.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "PeeyashStudy", text: headline });
      } else {
        await download();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="border border-line rounded-2xl p-5">
      <p className="text-sm font-medium mb-3">Share your win</p>

      {/* The card that gets converted to an image — kept visually self-contained */}
      <div ref={cardRef} className="rounded-2xl p-8 bg-ink relative overflow-hidden" style={{ aspectRatio: "9/12" }}>
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-biro/30 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-high/20 blur-2xl" />
        <div className="relative h-full flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-high flex items-center justify-center">
              <span className="font-display font-bold text-ink text-sm">P</span>
            </div>
            <span className="font-display text-paper font-semibold">PeeyashStudy</span>
          </div>
          <div>
            <p className="text-4xl mb-4">🎓</p>
            <p className="font-display text-2xl font-semibold text-paper leading-snug mb-2">{headline}</p>
            <p className="text-paper/60 text-sm">{subtext}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={share} disabled={generating}
          className="flex-1 bg-ink text-paper py-3 rounded-full text-sm font-medium hover:bg-biro transition-colors disabled:opacity-50">
          {generating ? "Preparing…" : "Share"}
        </button>
        <button onClick={download} disabled={generating}
          className="flex-1 border border-line py-3 rounded-full text-sm font-medium hover:border-biro transition-colors disabled:opacity-50">
          Download
        </button>
      </div>
    </div>
  );
}
