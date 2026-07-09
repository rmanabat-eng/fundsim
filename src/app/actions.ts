"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FUND_SIZE, SECTORS, STAGES } from "@/lib/constants";

export type FormState = { error: string } | null;

function parseInvestmentForm(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const sector = String(formData.get("sector") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const checkSize = Number(formData.get("checkSize"));
  const postMoneyValuation = Number(formData.get("postMoneyValuation"));
  const investmentDate = String(formData.get("investmentDate") ?? "");

  if (!companyName) return { error: "Company name is required." };
  if (!SECTORS.includes(sector as (typeof SECTORS)[number]))
    return { error: "Invalid sector." };
  if (!STAGES.includes(stage as (typeof STAGES)[number]))
    return { error: "Invalid stage." };
  if (!Number.isFinite(checkSize) || checkSize <= 0)
    return { error: "Check size must be greater than 0." };
  if (!Number.isFinite(postMoneyValuation) || postMoneyValuation <= checkSize)
    return { error: "Post-money valuation must be greater than check size." };
  if (!investmentDate || Number.isNaN(Date.parse(investmentDate)))
    return { error: "A valid investment date is required." };

  return {
    data: {
      companyName,
      sector,
      stage: stage as (typeof STAGES)[number],
      checkSize,
      postMoneyValuation,
      investmentDate: new Date(investmentDate),
    },
  };
}

export async function createInvestment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseInvestmentForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.investment.findMany({ select: { checkSize: true } });
  const deployed = existing.reduce((sum, inv) => sum + inv.checkSize, 0);
  const remaining = FUND_SIZE - deployed;

  if (parsed.data.checkSize > remaining) {
    return {
      error: `This check exceeds remaining fund capital. Only ${remaining.toLocaleString(
        "en-US",
        { style: "currency", currency: "USD", maximumFractionDigits: 0 }
      )} left to deploy.`,
    };
  }

  if (existing.length >= 15) {
    return { error: "Maximum of 15 investments reached." };
  }

  await prisma.investment.create({ data: parsed.data });
  revalidatePath("/");
  redirect("/");
}

export async function updateInvestment(
  id: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = parseInvestmentForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.investment.findMany({
    where: { id: { not: id } },
    select: { checkSize: true },
  });
  const deployed = existing.reduce((sum, inv) => sum + inv.checkSize, 0);
  const remaining = FUND_SIZE - deployed;

  if (parsed.data.checkSize > remaining) {
    return {
      error: `This check exceeds remaining fund capital. Only ${remaining.toLocaleString(
        "en-US",
        { style: "currency", currency: "USD", maximumFractionDigits: 0 }
      )} left to deploy.`,
    };
  }

  await prisma.investment.update({ where: { id }, data: parsed.data });
  revalidatePath("/");
  redirect("/");
}

export async function deleteInvestment(id: string) {
  await prisma.investment.delete({ where: { id } });
  revalidatePath("/");
}
