/**
 * ข้อมูลหน้า "เกี่ยวกับพวกเรา" (/about) — แก้ไฟล์นี้ไฟล์เดียว
 *
 * รูปสมาชิก: วางไฟล์ไว้ใน public/team/ แล้วใส่ path เช่น "/team/member1.jpg"
 * (แนะนำรูปแนวตั้งสัดส่วน 4:5) ถ้ายังไม่มีรูปให้ใส่ null จะแสดงอักษรย่อแทน
 */

export type TeamMember = {
  name: string;
  studentId: string;
  photo: string | null;
};

export const TEAM: TeamMember[] = [
  { name: "ณัฐวุฒิ ว่องนิมิต", studentId: "2313110815", photo: "/team/nattawut.gif" },
  { name: "ภูมินันท์ คูโรดะ", studentId: "2313110906", photo: "/team/phuminan.gif" },
];

type Text = { th: string; en: string };
const same = (s: string): Text => ({ th: s, en: s });

/** ข้อมูลรายวิชา แสดงตามลำดับ (เพิ่ม/ลบแถวได้ตามต้องการ) — ข้อความแยกภาษาไทย/อังกฤษ */
export const COURSE: { label: Text; value: Text; sub?: Partial<Text> }[] = [
  { label: { th: "รหัสวิชา", en: "Course code" }, value: same("ITE-444") },
  { label: { th: "ชื่อวิชา", en: "Course" }, value: same("Fullstack Technology"), sub: { th: "เทคโนโลยีฟูลสแต็ก" } },
  { label: { th: "หน่วยกิต", en: "Credits" }, value: same("3 (3-0-6)") },
  { label: { th: "อาจารย์ผู้สอน", en: "Instructor" }, value: same("ดร.พิศิษฐ์ บวรเลิศสุธี") },
  { label: { th: "คณะ", en: "Faculty" }, value: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
  { label: { th: "หลักสูตร", en: "Program" }, value: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
  { label: { th: "สถาบัน", en: "Institution" }, value: { th: "สถาบันเทคโนโลยีไทย-ญี่ปุ่น", en: "Thai-Nichi Institute of Technology" } },
];
