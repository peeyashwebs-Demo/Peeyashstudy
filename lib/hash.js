import crypto from "crypto";
export function hashText(text) {
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
