// One-off: copies every row out of the local SQLite dev.db into the Postgres
// database DATABASE_URL now points at, preserving ids so relations (Company
// -> Round/Decision, Deal -> Company) still line up. Run once after `prisma
// migrate dev` has created the empty tables on Postgres. Safe to re-run
// against an empty Postgres database; NOT safe to run twice against the same
// target (ids would collide).
import "dotenv/config";
import Database from "better-sqlite3";
import { prisma } from "../src/lib/prisma";

const SQLITE_PATH = process.argv[2] ?? "dev.db";

const db = new Database(SQLITE_PATH, { readonly: true });

function rows<T>(table: string): T[] {
  return db.prepare(`SELECT * FROM "${table}"`).all() as T[];
}

async function main() {
  console.log(`Reading from ${SQLITE_PATH}, writing to Postgres...`);

  // Insertion order matters: Deal before Company (Company.dealId), Company
  // before Round/Decision (their companyId).
  const fundSettings = rows<{
    id: number;
    fundSize: number;
    maxCompanies: number;
  }>("FundSettings");
  const scenarios = rows<{
    id: string;
    name: string;
    createdAt: string;
    data: string;
  }>("Scenario");
  const games = rows<{
    id: number;
    year: number;
    status: string;
    market: string;
    startedAt: string;
  }>("Game");
  const deals = rows<{
    id: string;
    year: number;
    name: string;
    sector: string;
    stage: string;
    raised: number;
    postMoney: number;
    description: string;
    referredBy: string | null;
    signals: string;
    quality: number;
    status: string;
  }>("Deal");
  const companies = rows<{
    id: string;
    name: string;
    sector: string;
    description: string;
    referredBy: string | null;
    createdAt: string;
    exitValue: number | null;
    exitDate: string | null;
    quality: number;
    scenarioState: string;
    dealId: string | null;
  }>("Company");
  const rounds = rows<{
    id: string;
    companyId: string;
    stage: string;
    date: string;
    raised: number;
    postMoney: number;
    yourCheck: number;
  }>("Round");
  const decisions = rows<{
    id: string;
    year: number;
    type: string;
    companyId: string;
    payload: string;
    status: string;
  }>("Decision");

  if (fundSettings.length > 0) {
    await prisma.fundSettings.createMany({ data: fundSettings });
  }
  if (scenarios.length > 0) {
    await prisma.scenario.createMany({
      data: scenarios.map((s) => ({ ...s, createdAt: new Date(s.createdAt) })),
    });
  }
  if (games.length > 0) {
    await prisma.game.createMany({
      data: games.map((g) => ({ ...g, startedAt: new Date(g.startedAt) })),
    });
  }
  if (deals.length > 0) {
    await prisma.deal.createMany({
      data: deals.map((d) => ({ ...d, stage: d.stage as never })),
    });
  }
  if (companies.length > 0) {
    await prisma.company.createMany({
      data: companies.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        exitDate: c.exitDate ? new Date(c.exitDate) : null,
      })),
    });
  }
  if (rounds.length > 0) {
    await prisma.round.createMany({
      data: rounds.map((r) => ({
        ...r,
        stage: r.stage as never,
        date: new Date(r.date),
      })),
    });
  }
  if (decisions.length > 0) {
    await prisma.decision.createMany({ data: decisions });
  }

  const counts = {
    FundSettings: fundSettings.length,
    Scenario: scenarios.length,
    Game: games.length,
    Deal: deals.length,
    Company: companies.length,
    Round: rounds.length,
    Decision: decisions.length,
  };
  console.log("Rows copied:", counts);

  const postgresCounts = {
    FundSettings: await prisma.fundSettings.count(),
    Scenario: await prisma.scenario.count(),
    Game: await prisma.game.count(),
    Deal: await prisma.deal.count(),
    Company: await prisma.company.count(),
    Round: await prisma.round.count(),
    Decision: await prisma.decision.count(),
  };
  console.log("Rows now in Postgres:", postgresCounts);

  const mismatch = Object.keys(counts).some(
    (k) => counts[k as keyof typeof counts] !== postgresCounts[k as keyof typeof postgresCounts]
  );
  if (mismatch) {
    console.error("Row counts don't match — do not delete the SQLite file.");
    process.exit(1);
  }
  console.log("Counts match. Verify the data looks right before deleting dev.db.");
}

main()
  .then(async () => {
    db.close();
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    db.close();
    await prisma.$disconnect();
    process.exit(1);
  });
