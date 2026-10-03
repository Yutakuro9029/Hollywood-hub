"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import {
  optDate, optInt, optText, optUrl, parseId, reqText, toErrorState,
  type ActionState,
} from "@/lib/form";

function parseActor(fd: FormData) {
  return {
    name: reqText(fd, "name", "ชื่อดารา", 120),
    nationality: optText(fd, "nationality", "สัญชาติ", 60),
    birth_date: optDate(fd, "birth_date", "วันเกิด"),
    bio: optText(fd, "bio", "ประวัติ", 10_000),
    avatar_url: optUrl(fd, "avatar_url", "รูปโปรไฟล์"),
    awards_count: optInt(fd, "awards_count", "จำนวนรางวัล", 0, 10_000) ?? 0,
  };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/actors");
}

export async function createActor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin(); // ต้องอยู่นอก try/catch เพราะ redirect() ใช้การ throw
  try {
    await prisma.actors.create({ data: parseActor(formData) });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}

// ใช้กับ <form action={updateActor.bind(null, id)}> + useActionState
export async function updateActor(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.actors.update({
      where: { id: parseId(id) },
      data: parseActor(formData),
    });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}

/** หมายเหตุ: ลบดาราจะลบหนังของดาราคนนั้นทั้งหมดด้วย (ON DELETE CASCADE) */
export async function deleteActor(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.actors.delete({ where: { id: parseId(id) } });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}
