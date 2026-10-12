/** แปลง Decimal (หรือตัวเลข) ของ Prisma เป็นข้อความทศนิยม 1 ตำแหน่ง */
export function formatRating(rating: { toString(): string } | null): string {
  if (rating === null) return "-";
  const n = Number(rating.toString());
  return Number.isFinite(n) ? n.toFixed(1) : "-";
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function calcAge(birth: Date | null): number | null {
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** ตัดข้อความยาว (เช่น ประวัติดารา) ก่อนส่งไปหน้าเว็บ — การ์ดแสดงแค่ไม่กี่บรรทัดอยู่แล้ว */
export function truncateText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// จำนวนรางวัลย้ายไปเป็น t.common.awards(n) ใน lib/i18n (null = "ไม่มีข้อมูล" ไม่ใช่ 0)
