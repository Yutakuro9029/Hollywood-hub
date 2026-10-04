import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;

async function fetchPopularActors() {
  // ดึงดารายอดนิยมหน้าแรก (20 คน)
  const res = await fetch(
    `https://api.themoviedb.org/3/person/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
  );
  const data = await res.json();

  for (const person of data.results) {
    // ดึงข้อมูลรายละเอียดของดาราแต่ละคน (วันเกิด, ประวัติ)
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/person/${person.id}?api_key=${TMDB_API_KEY}&language=en-US`,
    );
    const detail = await detailRes.json();

    // 1. เพิ่มข้อมูลดาราลงตาราง actors
    const actor = await prisma.actors.create({
      data: {
        name: detail.name,
        nationality: detail.place_of_birth
          ? detail.place_of_birth.split(",").pop()?.trim()
          : "USA",
        birth_date: detail.birthday ? new Date(detail.birthday) : null,
        bio: detail.biography?.slice(0, 1000) || "No biography available.",
        avatar_url: detail.profile_path
          ? `https://image.tmdb.org/t/p/w500${detail.profile_path}`
          : null,
        awards_count: Math.floor(Math.random() * 30) + 1, // สุ่มยอดรางวัลตัวอย่าง
      },
    });

    // 2. ดึงผลงานภาพยนตร์ของดาราคนนั้น
    const creditsRes = await fetch(
      `https://api.themoviedb.org/3/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`,
    );
    const credits = await creditsRes.json();
    const topMovies = (credits.cast || []).slice(0, 3); // เอาผลงานเด่น 3 เรื่อง

    for (const m of topMovies) {
      await prisma.movies.create({
        data: {
          actor_id: actor.id,
          title: m.title,
          release_year: m.release_date
            ? new Date(m.release_date).getFullYear()
            : null,
          genre: "Action, Drama",
          role_name: m.character || "Main Cast",
          box_office_mil: Number((Math.random() * 500 + 50).toFixed(2)), // สุ่ม Box Office
          rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 7.5,
          poster_url: m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : null,
        },
      });
    }
    console.log(`Synced: ${actor.name}`);
  }
}

fetchPopularActors()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
