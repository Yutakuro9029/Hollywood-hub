/**
 * ตรวจ ?next= ก่อนใช้ redirect — ยอมรับเฉพาะ path ภายในเว็บนี้
 * กัน open redirect เช่น "//evil.com", "/\evil.com", "https://evil.com"
 */
export function safeNext(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 500) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f]/.test(raw)) return null;
  return raw;
}
