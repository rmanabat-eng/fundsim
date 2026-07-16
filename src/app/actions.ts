"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SECTORS, STAGES } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { rollYearEvent } from "@/lib/simulate";
import { exitProceeds } from "@/lib/fund-math";

export type FormState = { error: string } | null;

function formatRemaining(remaining: number): string {
  return remaining.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

async function deployedExcludingRound(excludeRoundId?: string): Promise<number> {
  const rounds = await prisma.round.findMany({
    where: excludeRoundId ? { id: { not: excludeRoundId } } : undefined,
    select: { yourCheck: true },
  });
  return rounds.reduce((sum, r) => sum + r.yourCheck, 0);
}

type ParsedRound = {
  stage: (typeof STAGES)[number];
  date: Date;
  raised: number;
  postMoney: number;
  yourCheck: number;
};

function parseRoundFields(
  formData: FormData,
  { allowZeroCheck }: { allowZeroCheck: boolean }
): { error: string } | { data: ParsedRound } {
  const stage = String(formData.get("stage") ?? "");
  const date = String(formData.get("date") ?? "");
  const raised = Number(formData.get("raised"));
  const postMoney = Number(formData.get("postMoney"));
  const yourCheck = Number(formData.get("yourCheck"));

  if (!STAGES.includes(stage as (typeof STAGES)[number]))
    return { error: "Invalid stage." };
  if (!date || Number.isNaN(Date.parse(date)))
    return { error: "A valid round date is required." };
  if (!Number.isFinite(raised) || raised <= 0)
    return { error: "Total raised must be greater than 0." };
  if (!Number.isFinite(postMoney) || postMoney <= raised)
    return { error: "Post-money valuation must be greater than the total raised." };
  if (!Number.isFinite(yourCheck) || yourCheck < 0)
    return { error: "Your check can't be negative." };
  if (yourCheck === 0 && !allowZeroCheck)
    return { error: "Your first check must be greater than 0." };
  if (yourCheck > raised)
    return { error: "Your check can't exceed the round's total raised." };

  return {
    data: {
      stage: stage as (typeof STAGES)[number],
      date: new Date(date),
      raised,
      postMoney,
      yourCheck,
    },
  };
}

export async function createCompany(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("companyName") ?? "").trim();
  const sector = String(formData.get("sector") ?? "");

  if (!name) return { error: "Company name is required." };
  if (!SECTORS.includes(sector as (typeof SECTORS)[number]))
    return { error: "Invalid sector." };

  const parsed = parseRoundFields(formData, { allowZeroCheck: false });
  if ("error" in parsed) return { error: parsed.error };

  const settings = await getSettings();
  const companyCount = await prisma.company.count();
  if (companyCount >= settings.maxCompanies)
    return { error: `Maximum of ${settings.maxCompanies} companies reached.` };

  const deployed = await deployedExcludingRound();
  const remaining = settings.fundSize - deployed;
  if (parsed.data.yourCheck > remaining) {
    return {
      error: `This check exceeds remaining fund capital. Only ${formatRemaining(remaining)} left to deploy.`,
    };
  }

  await prisma.company.create({
    data: {
      name,
      sector,
      rounds: { create: parsed.data },
    },
  });
  revalidatePath("/");
  redirect("/");
}

export async function addRound(
  companyId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return { error: "Company not found." };
  if (company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };

  const parsed = parseRoundFields(formData, { allowZeroCheck: true });
  if ("error" in parsed) return { error: parsed.error };

  const settings = await getSettings();
  const deployed = await deployedExcludingRound();
  const remaining = settings.fundSize - deployed;
  if (parsed.data.yourCheck > remaining) {
    return {
      error: `This check exceeds remaining fund capital. Only ${formatRemaining(remaining)} left to deploy.`,
    };
  }

  await prisma.round.create({ data: { companyId, ...parsed.data } });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function updateRound(
  roundId: string,
  companyId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { company: { include: { rounds: true } } },
  });
  if (!round) return { error: "Round not found." };
  if (round.company.exitValue !== null)
    return { error: "This company has exited — its cap table is frozen." };

  const parsed = parseRoundFields(formData, { allowZeroCheck: true });
  if ("error" in parsed) return { error: parsed.error };

  if (parsed.data.yourCheck === 0) {
    const othersInvested = round.company.rounds.some(
      (r) => r.id !== roundId && r.yourCheck > 0
    );
    if (!othersInvested) {
      return {
        error:
          "At least one round needs a check — without one, your fund isn't in this company at all.",
      };
    }
  }

  const settings = await getSettings();
  const deployed = await deployedExcludingRound(roundId);
  const remaining = settings.fundSize - deployed;
  if (parsed.data.yourCheck > remaining) {
    return {
      error: `This check exceeds remaining fund capital. Only ${formatRemaining(remaining)} left to deploy.`,
    };
  }

  await prisma.round.update({ where: { id: roundId }, data: parsed.data });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function updateCompany(
  companyId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("companyName") ?? "").trim();
  const sector = String(formData.get("sector") ?? "");

  if (!name) return { error: "Company name is required." };
  if (!SECTORS.includes(sector as (typeof SECTORS)[number]))
    return { error: "Invalid sector." };

  await prisma.company.update({ where: { id: companyId }, data: { name, sector } });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  return null;
}

export async function recordExit(
  companyId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { rounds: { orderBy: { date: "asc" } } },
  });
  if (!company) return { error: "Company not found." };

  const writeOff = formData.get("writeOff") === "true";
  const exitValue = writeOff ? 0 : Number(formData.get("exitValue"));
  const date = String(formData.get("exitDate") ?? "");

  if (!Number.isFinite(exitValue) || exitValue < 0)
    return { error: "Exit valuation can't be negative." };
  if (!date || Number.isNaN(Date.parse(date)))
    return { error: "A valid exit date is required." };

  const exitDate = new Date(date);
  const lastRound = company.rounds[company.rounds.length - 1];
  if (lastRound && exitDate < lastRound.date)
    return { error: "Exit date can't be before the company's last round." };

  await prisma.company.update({
    where: { id: companyId },
    data: { exitValue, exitDate },
  });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
  redirect(`/companies/${companyId}`);
}

export async function undoExit(companyId: string) {
  await prisma.company.update({
    where: { id: companyId },
    data: { exitValue: null, exitDate: null },
  });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteRound(roundId: string, companyId: string) {
  const count = await prisma.round.count({ where: { companyId } });
  if (count <= 1) {
    // Deleting a company's only round would leave an empty shell; delete the company.
    await prisma.company.delete({ where: { id: companyId } });
    revalidatePath("/");
    redirect("/");
  }
  await prisma.round.delete({ where: { id: roundId } });
  revalidatePath("/");
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteCompany(id: string) {
  await prisma.company.delete({ where: { id } });
  revalidatePath("/");
}

export async function deleteAllCompanies() {
  await prisma.company.deleteMany();
  revalidatePath("/");
}

export async function updateSettings(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const fundSize = Number(formData.get("fundSize"));
  const maxCompanies = Number(formData.get("maxCompanies"));

  if (!Number.isFinite(fundSize) || fundSize <= 0)
    return { error: "Fund size must be greater than 0." };
  if (!Number.isInteger(maxCompanies) || maxCompanies < 1 || maxCompanies > 50)
    return { error: "Max companies must be a whole number between 1 and 50." };

  const deployed = await deployedExcludingRound();
  if (fundSize < deployed) {
    return {
      error: `Fund size can't be below what's already deployed (${formatRemaining(deployed)}).`,
    };
  }
  const companyCount = await prisma.company.count();
  if (maxCompanies < companyCount) {
    return {
      error: `Max companies can't be below your current ${companyCount} companies.`,
    };
  }

  await prisma.fundSettings.upsert({
    where: { id: 1 },
    update: { fundSize, maxCompanies },
    create: { fundSize, maxCompanies },
  });
  revalidatePath("/");
  redirect("/");
}

// ---- Scenarios: named snapshots of the whole portfolio + settings ----

type ScenarioData = {
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

export async function saveScenario(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the scenario a name." };
  if (name.length > 40) return { error: "Keep the name under 40 characters." };

  const settings = await getSettings();
  const companies = await prisma.company.findMany({
    include: { rounds: { orderBy: { date: "asc" } } },
  });

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

  await prisma.scenario.create({ data: { name, data: JSON.stringify(data) } });
  revalidatePath("/scenarios");
  return null;
}

// Replaces the current portfolio and settings with the snapshot.
export async function loadScenario(id: string) {
  const scenario = await prisma.scenario.findUnique({ where: { id } });
  if (!scenario) return;
  const data: ScenarioData = JSON.parse(scenario.data);

  await prisma.company.deleteMany();
  for (const c of data.companies) {
    await prisma.company.create({
      data: {
        name: c.name,
        sector: c.sector,
        exitValue: c.exitValue,
        exitDate: c.exitDate ? new Date(c.exitDate) : null,
        rounds: {
          create: c.rounds.map((r) => ({
            stage: r.stage as (typeof STAGES)[number],
            date: new Date(r.date),
            raised: r.raised,
            postMoney: r.postMoney,
            yourCheck: r.yourCheck,
          })),
        },
      },
    });
  }
  await prisma.fundSettings.upsert({
    where: { id: 1 },
    update: { fundSize: data.fundSize, maxCompanies: data.maxCompanies },
    create: { fundSize: data.fundSize, maxCompanies: data.maxCompanies },
  });

  revalidatePath("/");
  revalidatePath("/scenarios");
}

export async function deleteScenario(id: string) {
  await prisma.scenario.delete({ where: { id } });
  revalidatePath("/scenarios");
}

export type SimulationSummary = {
  raised: number;
  exited: number;
  writtenOff: number;
  quiet: number;
  distributions: number; // cash returned by this year's exits
};

// Advance the whole portfolio one simulated year: every active company rolls
// a raise, an exit, a shutdown, or a quiet year. Simulated rounds never
// spend the fund's money (yourCheck = 0) — follow on by editing the round.
export async function simulateYear(): Promise<SimulationSummary> {
  const companies = await prisma.company.findMany({
    include: { rounds: { orderBy: { date: "asc" } } },
  });

  // The sim clock starts at the latest date anywhere in the fund.
  const simNow = new Date(
    Math.max(
      Date.now(),
      ...companies.flatMap((c) => [
        ...c.rounds.map((r) => r.date.getTime()),
        c.exitDate?.getTime() ?? 0,
      ])
    )
  );

  const summary: SimulationSummary = {
    raised: 0,
    exited: 0,
    writtenOff: 0,
    quiet: 0,
    distributions: 0,
  };

  for (const company of companies) {
    if (company.exitValue !== null || company.rounds.length === 0) continue;
    const latest = company.rounds[company.rounds.length - 1];
    const event = rollYearEvent(
      { stage: latest.stage, postMoney: latest.postMoney, lastDate: latest.date },
      simNow
    );

    if (event.kind === "round") {
      await prisma.round.create({
        data: {
          companyId: company.id,
          stage: event.stage as (typeof STAGES)[number],
          date: new Date(event.date),
          raised: event.raised,
          postMoney: event.postMoney,
          yourCheck: 0,
        },
      });
      summary.raised++;
    } else if (event.kind === "exit" || event.kind === "writeOff") {
      const exitValue = event.kind === "exit" ? event.exitValue : 0;
      await prisma.company.update({
        where: { id: company.id },
        data: { exitValue, exitDate: new Date(event.exitDate) },
      });
      if (event.kind === "exit") {
        summary.exited++;
        summary.distributions += exitProceeds(company.rounds, exitValue);
      } else {
        summary.writtenOff++;
      }
    } else {
      summary.quiet++;
    }
  }

  revalidatePath("/");
  return summary;
}
