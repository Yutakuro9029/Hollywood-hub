import type { Prisma } from "@prisma/client";

/** include สำหรับการ์ดดารา: หนังคะแนนสูงสุด 2 เรื่อง + จำนวนหนังทั้งหมด */
export const actorCardInclude = {
  credits: {
    orderBy: [{ movie: { rating: "desc" } }, { movie_id: "asc" }],
    take: 2,
    include: {
      movie: {
        select: { id: true, title: true, release_year: true, genre: true, rating: true },
      },
    },
  },
  _count: { select: { credits: true } },
} satisfies Prisma.actorsInclude;
