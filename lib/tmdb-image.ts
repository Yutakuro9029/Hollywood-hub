/**
 * TMDB มีรูปหลายขนาดใน path เดียวกัน (…/t/p/<size>/<file>.jpg)
 * เลือกขนาดให้พอดีกับที่แสดงจริง (เผื่อจอ 2x) แทนการโหลด w500 ทุกที่
 *   w92  = thumbnail เล็กในตาราง/แดชบอร์ด
 *   w185 = รูปดาราวงกลม, โปสเตอร์เล็ก
 *   w342 = โปสเตอร์ในกริด
 *   w500 = โปสเตอร์/รูปใหญ่หน้ารายละเอียด
 *   w780 / w1280 = ภาพ backdrop แนวนอน (มือถือ / จอใหญ่)
 * URL ที่ไม่ใช่ของ TMDB (เช่น แอดมินใส่เอง) คืนค่าเดิม
 */
export type TmdbSize = "w92" | "w185" | "w342" | "w500" | "w780" | "w1280";

const TMDB_PATH = /^(https:\/\/image\.tmdb\.org\/t\/p\/)[^/]+(\/.+)$/;

export function tmdbImage(url: string | null, size: TmdbSize): string | null {
  if (!url) return null;
  return url.replace(TMDB_PATH, `$1${size}$2`);
}
