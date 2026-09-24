import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Shared by the dashboard's manual "save scenario" button and campaign mode's
// automatic snapshot-before-wipe (see startCampaign in app/play/actions.ts) —
// one snapshot shape, so a campaign run and a sandbox scenario show up in the
// same Scenarios table on equal footing instead of being two disconnected
// systems.
export type ScenarioData = {
  fundSize: number;
  maxCompanies: number;
  companies: {
    name: string;
    sector: string;
    exitValue: number | null;
    exitDate: string | null;
    rounds: {
      stage: string;
      date: string;
      raised: number;
      postMoney: number;
      yourCheck: number;
    }[];
  }[];
};

// Snapshots the visitor's current portfolio + settings into a named
// Scenario row. Read-only with respect to the portfolio itself — callers
// decide separately whether/when to wipe it.
export async function snapshotPortfolioAsScenario(visitorId: string, name: string) {
  const settings = await getSettings();
  const companies = await prisma.company.findMany({
    where: { visitorId },
    include: { rounds: { orderBy: { date: "asc" } } },
  });
  if (companies.length === 0) return; // nothing to preserve

  const data: ScenarioData = {
    fundSize: settings.fundSize,
    maxCompanies: settings.maxCompanies,
    companies: companies.map((c) => ({
      name: c.name,
      sector: c.sector,
      exitValue: c.exitValue,
      exitDate: c.exitDate?.toISOString() ?? null,
      rounds: c.rounds.map((r) => ({
        stage: r.stage,
        date: r.date.toISOString(),
        raised: r.raised,
        postMoney: r.postMoney,
        yourCheck: r.yourCheck,
      })),
    })),
  };

  await prisma.scenario.create({
    data: { visitorId, name, data: JSON.stringify(data) },
  });
}
