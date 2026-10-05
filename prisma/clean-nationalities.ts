import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanNationalities() {
  console.log("กำลังปรับปรุงข้อมูลสัญชาติให้เป็นมาตรฐานเดียวกัน...");

  // 1. รวมกลุ่มเกาหลี (Korea, Republic of Korea -> South Korea)
  const korea = await prisma.actors.updateMany({
    where: {
      nationality: {
        in: [
          "Korea",
          "Republic of Korea",
          "korea",
          "south korea",
          "South Korea",
        ],
      },
    },
    data: {
      nationality: "South Korea",
    },
  });

  // 2. รวมกลุ่มสหรัฐอเมริกา (United States, U.S., U.S.A. -> USA)
  const usa = await prisma.actors.updateMany({
    where: {
      nationality: {
        in: [
          "United States",
          "United States of America",
          "U.S.",
          "U.S.A.",
          "usa",
        ],
      },
    },
    data: {
      nationality: "USA",
    },
  });

  // 3. รวมกลุ่มสหราชอาณาจักร (England, Scotland, Wales, UK -> United Kingdom)
  const uk = await prisma.actors.updateMany({
    where: {
      nationality: {
        in: ["UK", "England", "Great Britain", "Scotland", "Wales", "uk"],
      },
    },
    data: {
      nationality: "United Kingdom",
    },
  });

  console.log(`อัปเดต South Korea: ${korea.count} รายการ`);
  console.log(`อัปเดต USA: ${usa.count} รายการ`);
  console.log(`อัปเดต United Kingdom: ${uk.count} รายการ`);
}

cleanNationalities()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
