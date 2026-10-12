"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { FieldError, validators, type ActionState, type Validators } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";

/** "action,Sci-Fi ,, Drama" → "action, Sci-Fi, Drama" (ตัดช่องว่าง/ค่าว่าง/ซ้ำ ให้รูปแบบตรงกับที่ค้นหา) */
function normalizeGenres(raw: string | null): string | null {
  if (raw === null) return null;
  const parts = [...new Set(raw.split(",").map((g) => g.trim()).filter(Boolean))];
  return parts.length ? parts.join(", ") : null;
}

function parseMovie(fd: FormData, v: Validators, L: Dict["form"]["labels"]) {
  return {
    title: v.reqText(fd, "title", L.title, 200),
    release_year: v.optInt(fd, "release_year", L.year, 1888, 2100),
    genre: normalizeGenres(v.optText(fd, "genre", L.genre, 100)),
    // เว้นว่าง = ไม่ทราบรายได้ (null) ไม่ใช่ 0
    box_office_mil: v.optDecimal(fd, "box_office_mil", L.boxOffice, 0, 99_999_999, 2),
    rating: v.optDecimal(fd, "rating", L.rating, 0, 10, 1),
    poster_url: v.optUrl(fd, "poster_url", L.poster),
  };
}

/**
 * นักแสดง: ฟอร์มส่ง cast_actor_id[] กับ cast_role[] คู่กันตามลำดับ
 * ลำดับในฟอร์ม = ลำดับเครดิต (แถวแรกคือนักแสดงนำ)
 */
function parseCast(fd: FormData, v: Validators, m: Dict["form"]) {
  const ids = fd.getAll("cast_actor_id").map((x) => String(x).trim());
  const roles = fd.getAll("cast_role").map((x) => String(x).trim());

  const cast: { actor_id: number; role_name: string | null; billing_order: number }[] = [];
  const seen = new Set<number>();
  ids.forEach((raw, i) => {
    if (!raw) return; // แถวที่ยังไม่ได้เลือกดารา
    const actor_id = v.parseId(raw, m.labels.actor);
    if (seen.has(actor_id)) throw new FieldError(m.duplicateCast);
    seen.add(actor_id);
    const role = roles[i] ?? "";
    if (role.length > 120) throw new FieldError(m.roleTooLong);
    cast.push({ actor_id, role_name: role || null, billing_order: cast.length });
  });

  if (cast.length === 0) throw new FieldError(m.castRequired);
  return cast;
}

/**
 * ห้ามชื่อภาพยนตร์ซ้ำ (เทียบแบบไม่สนตัวพิมพ์เล็ก/ใหญ่) — แก้ไขข้ามแถวของตัวเอง
 * ตรวจในหลังบ้านเท่านั้น ไม่ใส่ unique ใน DB เพราะหนังจริงชื่อซ้ำได้ (เช่น ฉบับรีเมก) และ seed ยังต้องนำเข้าได้
 */
async function assertUniqueTitle(title: string, m: Dict["form"], exceptId?: number) {
  const dup = await prisma.movies.findFirst({
    where: { title, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (dup) throw new FieldError(m.duplicateMovie(title));
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/movies");
}

/** ตัวตรวจฟอร์ม + ข้อความ ตามภาษาที่ผู้ใช้เลือก */
async function formKit() {
  const { t } = await getI18n();
  return { v: validators(t.form), m: t.form };
}

export async function createMovie(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { v, m } = await formKit();
  try {
    const movie = parseMovie(formData, v, m.labels);
    await assertUniqueTitle(movie.title, m);
    const cast = parseCast(formData, v, m);
    await prisma.movies.create({
      data: { ...movie, cast: { create: cast } },
    });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

export async function updateMovie(
  id: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const { v, m } = await formKit();
  try {
    const movieId = v.parseId(id);
    const movie = parseMovie(formData, v, m.labels);
    await assertUniqueTitle(movie.title, m, movieId);
    const cast = parseCast(formData, v, m);
    // แทนที่รายชื่อนักแสดงทั้งชุดในธุรกรรมเดียว
    await prisma.movies.update({
      where: { id: movieId },
      data: {
        ...movie,
        cast: { deleteMany: {}, create: cast },
      },
    });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

export async function deleteMovie(id: number): Promise<ActionState> {
  await requireAdmin();
  const { v } = await formKit();
  try {
    await prisma.movies.delete({ where: { id: v.parseId(id) } });
    refresh();
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}
