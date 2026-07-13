"use client";
import { useEffect, useState } from "react";

const LINES = [
  "Your TMA lands in your inbox.",
  "Understanding it shouldn't take a week."
];

const TYPE_SPEED_MS = 32;   // per character
const LINE_PAUSE_MS = 350;  // pause between line 1 finishing and line 2 starting

export default function TypingHeadline() {
  const [displayedLines, setDisplayedLines] = useState(["", ""]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lineIndex >= LINES.length) {
      setDone(true);
      return;
    }
    const currentLine = LINES[lineIndex];

    if (charIndex <= currentLine.length) {
      const t = setTimeout(() => {
        setDisplayedLines((prev) => {
          const next = [...prev];
          next[lineIndex] = currentLine.slice(0, charIndex);
          return next;
        });
        setCharIndex((c) => c + 1);
      }, TYPE_SPEED_MS);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLineIndex((l) => l + 1);
      setCharIndex(0);
    }, LINE_PAUSE_MS);
    return () => clearTimeout(t);
  }, [charIndex, lineIndex]);

  return (
    <h1
      className="font-display text-[clamp(1.85rem,6vw,3.75rem)] leading-[1.2] md:leading-[1.08] font-semibold max-w-3xl min-h-[5.4rem] sm:min-h-[6.2rem] md:min-h-[8.4rem]"
    >
      {/* Full text always in the DOM for SEO / no-JS / screen readers */}
      <span className="sr-only">{LINES.join(" ")}</span>
      <span aria-hidden="true">
        {displayedLines[0]}
        {lineIndex === 0 && !done && <Cursor />}
        <br />
        {displayedLines[1]}
        {(lineIndex === 1 || done) && <Cursor />}
      </span>
    </h1>
  );
}

function Cursor() {
  return (
    <span
      className="inline-block w-[0.09em] h-[0.85em] bg-current ml-1 align-middle animate-pulse"
    />
  );
}
