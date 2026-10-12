"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { FieldError, validators, type ActionState, type Validators } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";

function parseActor(fd: FormData, v: Validators, L: Dict["form"]["labels"]) {
  return {
    name: v.reqText(fd, "name", L.actorName, 120),
    nationality: v.optText(fd, "nationality", L.nationality, 60),
    birth_date: v.optDate(fd, "birth_date", L.birthDate),
    bio: v.optText(fd, "bio", L.bio, 10_000),
    avatar_url: v.optUrl(fd, "avatar_url", L.avatar),
    // เว้นว่าง = ไม่มีข้อมูลรางวัล (null) ไม่ใช่ 0
    awards_count: v.optInt(fd, "awards_count", L.awards, 0, 10_000),
  };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/actors");
}

/** ตัวตรวจฟอร์ม + ป้ายชื่อช่อง ตามภาษาที่ผู้ใช้เลือก */
async function formKit() {
  const { t } = await getI18n();
  return { v: validators(t.form), L: t.form.labels, m: t.form };
}

/**
 * ห้ามชื่อดาราซ้ำ (เทียบแบบไม่สนตัวพิมพ์เล็ก/ใหญ่ตาม collation ของคอลัมน์) — แก้ไขข้ามแถวของตัวเอง
 * ตรวจในหลังบ้านเท่านั้น ไม่ใส่ unique ใน DB เพราะข้อมูลจาก TMDB อาจมีชื่อซ้ำได้จริง
 */
async function assertUniqueName(name: string, m: Dict["form"], exceptId?: number) {
  const dup = await prisma.actors.findFirst({
    where: { name, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (dup) throw new FieldError(m.duplicateActor(name));
}

export async function createActor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(); // ต้องอยู่นอก try/catch เพราะ redirect() ใช้การ throw
  const { v, L, m } = await formKit();
  try {
    const data = parseActor(formData, v, L);
    await assertUniqueName(data.name, m);
    await prisma.actors.create({ data });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

// ใช้กับ <form action={updateActor.bind(null, id)}> + useActionState
export async function updateActor(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { v, L, m } = await formKit();
  try {
    const actorId = v.parseId(id);
    const data = parseActor(formData, v, L);
    await assertUniqueName(data.name, m, actorId);
    await prisma.actors.update({ where: { id: actorId }, data });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

/** ลบดาราจะลบเฉพาะเครดิตนักแสดงของคนนั้น (movie_cast) — ตัวหนังยังอยู่ */
export async function deleteActor(id: number): Promise<ActionState> {
  await requireAdmin();
  const { v } = await formKit();
  try {
    await prisma.actors.delete({ where: { id: v.parseId(id) } });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}
