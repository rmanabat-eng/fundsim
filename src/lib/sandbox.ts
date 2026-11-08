import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";
import { campaignHoldsPortfolio } from "@/lib/campaign";

// The sandbox (dashboard, hand-entered companies/rounds/exits, simulate a
// year, scenario loading) shares one portfolio with campaign mode, so it's
// locked while a campaign holds that portfolio. Settings lock only while a
// run is active: fund size doesn't feed the leaderboard entry, and the ended
// scorecard links to Settings for the next fund.

export const SANDBOX_LOCKED =
  "Locked during a campaign — finish the run and leave its scorecard to use the sandbox.";

export async function campaignLock() {
  const visitorId = await getVisitorId();
  const game = await prisma.game.findUnique({
    where: { visitorId },
    select: { status: true, dismissed: true },
  });
  return { portfolio: campaignHoldsPortfolio(game), settings: game?.status === "active" };
}

export async function requireSandbox() {
  if ((await campaignLock()).portfolio) redirect("/play");
}
