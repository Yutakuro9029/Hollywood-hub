"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { validators, type ActionState } from "@/lib/form";
import { getI18n } from "@/lib/i18n/server";

/** ข้อความ + ตัวตรวจค่า ตามภาษาที่ผู้ใช้เลือก */
async function kit() {
  const { t } = await getI18n();
  return { v: validators(t.form), loginRequired: { error: t.watchlist.loginRequired, code: "LOGIN_REQUIRED" } as ActionState };
}

/*
 * ใช้รูปแบบ "ตั้งค่า" (saved = true/false) แทน toggle
 * เพื่อให้กดซ้ำ/ส่งซ้ำได้ผลเหมือนเดิม (idempotent) และ UI แบบ optimistic ไม่เพี้ยน
 * userId มาจาก session ฝั่งเซิร์ฟเวอร์เสมอ — ไม่รับจาก client
 */

export async function setMovieSaved(movieId: number, saved: boolean): Promise<ActionState> {
  const [session, { v, loginRequired }] = await Promise.all([getSession(), kit()]);
  if (!session) return loginRequired;
  try {
    const key = { user_id: session.userId, movie_id: v.parseId(movieId) };
    if (saved) {
      await prisma.watchlist_movies.upsert({
        where: { user_id_movie_id: key },
        create: key,
        update: {},
      });
    } else {
      await prisma.watchlist_movies.deleteMany({ where: key });
    }
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

export async function setActorSaved(actorId: number, saved: boolean): Promise<ActionState> {
  const [session, { v, loginRequired }] = await Promise.all([getSession(), kit()]);
  if (!session) return loginRequired;
  try {
    const key = { user_id: session.userId, actor_id: v.parseId(actorId) };
    if (saved) {
      await prisma.watchlist_actors.upsert({
        where: { user_id_actor_id: key },
        create: key,
        update: {},
      });
    } else {
      await prisma.watchlist_actors.deleteMany({ where: key });
    }
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}

export async function clearWatchlist(): Promise<ActionState> {
  const [session, { v, loginRequired }] = await Promise.all([getSession(), kit()]);
  if (!session) return loginRequired;
  try {
    await prisma.$transaction([
      prisma.watchlist_movies.deleteMany({ where: { user_id: session.userId } }),
      prisma.watchlist_actors.deleteMany({ where: { user_id: session.userId } }),
    ]);
    return { success: true };
  } catch (e) {
    return v.toErrorState(e);
  }
}
