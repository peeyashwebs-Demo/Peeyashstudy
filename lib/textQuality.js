// Sanity-checks PDF text extraction before it's sent to the AI.
// Complex layouts (multi-column PDFs, scanned images, tables mixed with text —
// exactly what MIVA's TMA template uses) can make pdf-parse return garbled or
// out-of-order text. Sending that straight to Gemini produces a confident-looking
// but wrong breakdown. Better to catch it and ask the student to re-upload.

export function assessExtractionQuality(text) {
  if (!text || text.trim().length < 30) {
    return { ok: false, reason: "empty" };
  }

  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 15) {
    return { ok: false, reason: "too_short" };
  }

  // Ratio of characters that are letters/numbers/basic punctuation vs "junk"
  // (control chars, repeated symbols from broken column merges, etc.)
  const junkChars = (trimmed.match(/[^\w\s.,;:!?'"()%\-\/&]/g) || []).length;
  const junkRatio = junkChars / trimmed.length;
  if (junkRatio > 0.08) {
    return { ok: false, reason: "garbled" };
  }

  // Average word length way outside normal English/academic text usually means
  // words got fused or split by a broken multi-column extraction.
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wordCount;
  if (avgWordLen > 12 || avgWordLen < 2.5) {
    return { ok: false, reason: "broken_layout" };
  }

  // A real assignment/TMA should contain a reasonable share of common English
  // function words. If almost none appear, extraction likely scrambled word order
  // or pulled from a scanned image (OCR noise / no real text layer).
  const commonWords = ["the", "and", "of", "to", "a", "in", "is", "for", "that", "on"];
  const lowerWords = new Set(words.map((w) => w.toLowerCase().replace(/[^\w]/g, "")));
  const commonHits = commonWords.filter((w) => lowerWords.has(w)).length;
  if (wordCount > 60 && commonHits < 2) {
    return { ok: false, reason: "scrambled" };
  }

  return { ok: true };
}

export const QUALITY_ERROR_MESSAGES = {
  empty: "This PDF looks empty or scanned. A clear text-based PDF works best — try exporting it again or re-scanning with OCR turned on.",
  too_short: "We couldn't find enough readable text in this PDF. Make sure it's the full assignment, not a cover page.",
  garbled: "This PDF's layout is confusing our reader (this happens with multi-column or table-heavy PDFs). Try re-uploading, or copy the questions into a plain PDF/Word doc and upload that instead.",
  broken_layout: "The text in this PDF came through jumbled, likely from a complex page layout. Try re-uploading, or paste the questions into a simple doc first.",
  scrambled: "The text extracted from this PDF doesn't read like normal sentences — the layout may have scrambled word order. Try re-uploading, or paste the questions into a simple doc first."
};
