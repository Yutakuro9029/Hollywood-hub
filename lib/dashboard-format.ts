/** ฟังก์ชันจัดรูปแบบ/คำนวณเฉพาะหน้า Dashboard (แยกจาก lib/format.ts เดิมของโปรเจกต์) — ใช้ได้ทั้ง Server และ Client */

export const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** ล้านดอลลาร์ -> $850M / $1.45B */
export const fmtMoney = (m: number) =>
  m >= 1000 ? `$${fmtNumber(m / 1000, 2)}B` : `$${fmtNumber(m, m < 100 ? 1 : 0)}M`;

export const avg = (xs: number[]) =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

/** genre เก็บเป็นสตริงคั่นด้วย comma เช่น "Sci-Fi, Action, Thriller" */
export const splitGenres = (g: string | null | undefined) =>
  (g ?? "").split(",").map((x) => x.trim()).filter(Boolean);

export function tally(items: string[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/** เก็บ n อันดับแรก ส่วนที่เหลือรวมเป็น "อื่นๆ" (กันรายการยาวเกินเมื่อข้อมูลเยอะ) */
export function topWithOther(
  rows: { label: string; value: number }[],
  n: number,
  otherLabel = "อื่นๆ",
): { label: string; value: number }[] {
  if (rows.length <= n) return rows;
  const rest = rows.slice(n).reduce((s, r) => s + r.value, 0);
  return [...rows.slice(0, n), { label: otherLabel, value: rest }];
}
