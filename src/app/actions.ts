"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FUND_SIZE, SECTORS, STAGES } from "@/lib/constants";

export type FormState = { error: string } | null;

const MAX_COMPANIES = 15;

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

  const companyCount = await prisma.company.count();
  if (companyCount >= MAX_COMPANIES)
    return { error: `Maximum of ${MAX_COMPANIES} companies reached.` };

  const deployed = await deployedExcludingRound();
  const remaining = FUND_SIZE - deployed;
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
  const parsed = parseRoundFields(formData, { allowZeroCheck: true });
  if ("error" in parsed) return { error: parsed.error };

  const deployed = await deployedExcludingRound();
  const remaining = FUND_SIZE - deployed;
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

  const deployed = await deployedExcludingRound(roundId);
  const remaining = FUND_SIZE - deployed;
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
