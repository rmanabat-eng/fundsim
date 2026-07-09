import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.investment.deleteMany();

  await prisma.investment.createMany({
    data: [
      {
        companyName: "AquaFlow Systems",
        sector: "Water Tech",
        stage: "SEED",
        checkSize: 250_000,
        postMoneyValuation: 8_000_000,
        investmentDate: new Date("2025-02-10"),
      },
      {
        companyName: "Ledgerly",
        sector: "Fintech",
        stage: "PRE_SEED",
        checkSize: 150_000,
        postMoneyValuation: 5_000_000,
        investmentDate: new Date("2025-05-22"),
      },
      {
        companyName: "Carelane Health",
        sector: "Health",
        stage: "SERIES_A",
        checkSize: 750_000,
        postMoneyValuation: 30_000_000,
        investmentDate: new Date("2025-09-14"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
