import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed data is a standalone demo fund, not tied to any real visitor cookie
  // — a fresh Visitor row every run keeps it isolated from whatever's already
  // in the database.
  const visitor = await prisma.visitor.create({ data: {} });
  const visitorId = visitor.id;
  console.log(`Seeded under visitor ${visitorId}`);

  // AquaFlow shows dilution: a seed check, then a Series A the fund sat out,
  // then a Series B where it wrote a follow-on check.
  await prisma.company.create({
    data: {
      visitorId,
      name: "AquaFlow Systems",
      sector: "Water Tech",
      rounds: {
        create: [
          {
            visitorId,
            stage: "SEED",
            date: new Date("2025-02-10"),
            raised: 2_000_000,
            postMoney: 8_000_000,
            yourCheck: 250_000,
          },
          {
            visitorId,
            stage: "SERIES_A",
            date: new Date("2025-11-05"),
            raised: 10_000_000,
            postMoney: 40_000_000,
            yourCheck: 0,
          },
          {
            visitorId,
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
      visitorId,
      name: "Ledgerly",
      sector: "Fintech",
      rounds: {
        create: [
          {
            visitorId,
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
      visitorId,
      name: "Carelane Health",
      sector: "Health",
      rounds: {
        create: [
          {
            visitorId,
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
