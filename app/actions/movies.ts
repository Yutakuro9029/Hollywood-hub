"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import {
  optDecimal, optInt, optText, optUrl, parseId, reqInt, reqText, toErrorState,
  type ActionState,
} from "@/lib/form";

function parseMovie(fd: FormData) {
  return {
    actor_id: reqInt(fd, "actor_id", "ดารา", 1, 4_294_967_295),
    title: reqText(fd, "title", "ชื่อภาพยนตร์", 200),
    release_year: optInt(fd, "release_year", "ปีที่ฉาย", 1888, 2100),
    genre: optText(fd, "genre", "ประเภท", 100),
    role_name: optText(fd, "role_name", "ชื่อบทบาท", 120),
    box_office_mil: optDecimal(fd, "box_office_mil", "รายได้", 0, 99_999_999, 2) ?? 0,
    rating: optDecimal(fd, "rating", "คะแนน", 0, 10, 1),
    poster_url: optUrl(fd, "poster_url", "โปสเตอร์"),
  };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/movies");
}

export async function createMovie(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.movies.create({ data: parseMovie(formData) });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}

export async function updateMovie(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.movies.update({
      where: { id: parseId(id) },
      data: parseMovie(formData),
    });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}

export async function deleteMovie(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.movies.delete({ where: { id: parseId(id) } });
    refresh();
    return { success: true };
  } catch (e) {
    return toErrorState(e);
  }
}
