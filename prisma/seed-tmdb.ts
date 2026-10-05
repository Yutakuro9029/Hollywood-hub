import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// ฟังก์ชันแปลงชื่อประเทศและสัญชาติให้เป็นมาตรฐานเดียวกัน
function normalizeCountry(rawPlace: string | null | undefined): string {
  if (!rawPlace) return "USA";

  const rawCountry = rawPlace.split(",").pop()?.trim().toLowerCase() || "";

  if (
    rawCountry.includes("korea") ||
    rawCountry.includes("south korea") ||
    rawCountry.includes("republic of korea")
  ) {
    return "South Korea";
  }

  if (
    rawCountry === "usa" ||
    rawCountry === "united states" ||
    rawCountry === "united states of america" ||
    rawCountry === "u.s." ||
    rawCountry === "u.s.a."
  ) {
    return "USA";
  }

  if (
    rawCountry === "uk" ||
    rawCountry === "united kingdom" ||
    rawCountry === "england" ||
    rawCountry === "great britain" ||
    rawCountry === "scotland" ||
    rawCountry === "wales"
  ) {
    return "United Kingdom";
  }

  const original = rawPlace.split(",").pop()?.trim() || "USA";
  return original.charAt(0).toUpperCase() + original.slice(1);
}

async function main() {
  if (!TMDB_API_KEY) {
    throw new Error("กรุณาระบุ TMDB_API_KEY ในไฟล์ .env ก่อนรัน");
  }

  console.log("กำลังเริ่มต้นดึงข้อมูลจาก TMDB API...");

  let totalActorsCount = 0;
  let totalMoviesCount = 0;
  const TOTAL_PAGES = 6;

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    console.log(`\nกำลังดึงรายชื่อดาราหน้าที่ ${page}/${TOTAL_PAGES}...`);

    const popularRes = await fetch(
      `https://api.themoviedb.org/3/person/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`,
    );

    if (!popularRes.ok) continue;

    const popularData = await popularRes.json();
    const persons = popularData.results || [];

    for (const person of persons) {
      if (!person.profile_path || !person.name) continue;

      try {
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/person/${person.id}?api_key=${TMDB_API_KEY}&language=en-US`,
        );
        const detail = await detailRes.json();

        // ใช้งานฟังก์ชัน normalizeCountry
        const nationality = normalizeCountry(detail.place_of_birth);
        const mockAwards =
          Math.floor(Math.random() * 35) + (person.popularity > 20 ? 5 : 0);

        const actor = await prisma.actors.create({
          data: {
            name: detail.name,
            nationality: nationality.slice(0, 60),
            birth_date: detail.birthday ? new Date(detail.birthday) : null,
            bio: detail.biography
              ? detail.biography.slice(0, 4000)
              : "No biography available.",
            avatar_url: `https://image.tmdb.org/t/p/w500${detail.profile_path}`,
            awards_count: mockAwards,
          },
        });
        totalActorsCount++;

        const creditsRes = await fetch(
          `https://api.themoviedb.org/3/person/${person.id}/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`,
        );
        const credits = await creditsRes.json();

        const castMovies = (credits.cast || [])
          .filter((m: any) => m.title && m.poster_path && m.release_date)
          .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))
          .slice(0, 3);

        for (const m of castMovies) {
          const movieGenres =
            (m.genre_ids || [])
              .map((id: number) => genreMap[id])
              .filter(Boolean)
              .slice(0, 3)
              .join(", ") || "Drama";

          const baseGross = (m.popularity || 10) * 8 + Math.random() * 150;
          const boxOffice = Math.min(
            1800,
            Math.max(25, Number(baseGross.toFixed(2))),
          );

          await prisma.movies.create({
            data: {
              actor_id: actor.id,
              title: m.title.slice(0, 200),
              release_year: new Date(m.release_date).getFullYear(),
              genre: movieGenres,
              role_name: m.character ? m.character.slice(0, 120) : "Lead Role",
              box_office_mil: boxOffice,
              rating: m.vote_average
                ? Number(Number(m.vote_average).toFixed(1))
                : 7.0,
              poster_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
            },
          });
          totalMoviesCount++;
        }

        console.log(
          `[${totalActorsCount}] นำเข้า: ${actor.name} (${nationality})`,
        );
        await sleep(120);
      } catch (err) {
        console.error(`ข้าม ${person.name}:`, err);
      }
    }
  }

  console.log(
    `\nดึงข้อมูลเสร็จสิ้น! ดารา ${totalActorsCount} คน, หนัง ${totalMoviesCount} เรื่อง`,
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
