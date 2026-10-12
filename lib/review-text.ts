/**
 * ทำความสะอาดข้อความรีวิวจาก TMDB: ตัดแท็ก HTML, ลิงก์ markdown และสัญลักษณ์ markdown
 * คืนเป็นย่อหน้า (แยกด้วยบรรทัดว่าง)
 */
export function cleanReviewParagraphs(text: string): string[] {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // แท็ก HTML ที่ผู้เขียนใส่มา เช่น <em>
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>`]/g, "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
