import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.company.deleteMany();

  // AquaFlow shows dilution: a seed check, then a Series A the fund sat out,
  // then a Series B where it wrote a follow-on check.
  await prisma.company.create({
    data: {
      name: "AquaFlow Systems",
      sector: "Water Tech",
      rounds: {
        create: [
          {
            stage: "SEED",
            date: new Date("2025-02-10"),
            raised: 2_000_000,
            postMoney: 8_000_000,
            yourCheck: 250_000,
          },
          {
            stage: "SERIES_A",
            date: new Date("2025-11-05"),
            raised: 10_000_000,
            postMoney: 40_000_000,
            yourCheck: 0,
          },
          {
            stage: "SERIES_B",
            date: new Date("2026-06-20"),
            raised: 25_000_000,
            postMoney: 120_000_000,
            yourCheck: 500_000,
          },
        ],
      },
    },
  });

  await prisma.company.create({
    data: {
      name: "Ledgerly",
      sector: "Fintech",
      rounds: {
        create: [
          {
            stage: "PRE_SEED",
            date: new Date("2025-05-22"),
            raised: 750_000,
            postMoney: 5_000_000,
            yourCheck: 150_000,
          },
        ],
      },
    },
  });

  await prisma.company.create({
    data: {
      name: "Carelane Health",
      sector: "Health",
      rounds: {
        create: [
          {
            stage: "SERIES_A",
            date: new Date("2025-09-14"),
            raised: 8_000_000,
            postMoney: 30_000_000,
            yourCheck: 750_000,
          },
        ],
      },
    },
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
