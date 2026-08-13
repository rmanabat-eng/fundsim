import { prisma } from "@/lib/prisma";
import { reputation } from "@/lib/campaign";

// Reputation reads the paper trail: every deal and decision row keeps its
// final status, so how you've treated founders so far is all in the database.
export async function currentReputation(visitorId: string) {
  const [
    bridgesFunded,
    bridgesRefused,
    costlyRefusals,
    proRataBacked,
    flatteringTermSheetsBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
    foundersOusted,
  ] = await Promise.all([
    prisma.decision.count({ where: { visitorId, type: "bridge", status: "resolved" } }),
    prisma.decision.count({
      where: { visitorId, type: { in: ["bridge", "pro_rata"] }, status: "declined" },
    }),
    prisma.decision.count({
      where: { visitorId, type: { in: ["bridge", "pro_rata"] }, status: "declined_costly" },
    }),
    prisma.decision.count({ where: { visitorId, type: "pro_rata", status: "resolved" } }),
    prisma.decision.count({
      where: { visitorId, type: "term_sheet", status: "resolved_flattering" },
    }),
    prisma.decision.count({
      where: {
        visitorId,
        type: { in: ["pivot", "ceo_replacement"] },
        status: "resolved",
      },
    }),
    prisma.decision.count({ where: { visitorId, status: "expired" } }),
    prisma.deal.count({ where: { visitorId, status: "expired" } }),
    prisma.decision.count({ where: { visitorId, status: "ousted" } }),
  ]);
  const rep = reputation({
    bridgesFunded,
    bridgesRefused,
    costlyRefusals,
    proRataBacked,
    flatteringTermSheetsBacked,
    adviceGiven,
    decisionsExpired,
    dealsExpired,
    foundersOusted,
  });
  const drivers = [
    bridgesFunded > 0 &&
      `${bridgesFunded} ${bridgesFunded === 1 ? "bridge" : "bridges"} funded`,
    proRataBacked > 0 &&
      `${proRataBacked} follow-on ${proRataBacked === 1 ? "round" : "rounds"} answered`,
    adviceGiven > 0 &&
      `${adviceGiven} founder ${adviceGiven === 1 ? "call" : "calls"} advised`,
    flatteringTermSheetsBacked > 0 &&
      `${flatteringTermSheetsBacked} flattering ${flatteringTermSheetsBacked === 1 ? "price" : "prices"} backed`,
    bridgesRefused > 0 &&
      `${bridgesRefused} ${bridgesRefused === 1 ? "ask" : "asks"} refused`,
    costlyRefusals > 0 &&
      `${costlyRefusals} trusted ${costlyRefusals === 1 ? "founder" : "founders"} turned down`,
    decisionsExpired > 0 &&
      `${decisionsExpired} ${decisionsExpired === 1 ? "founder" : "founders"} ghosted`,
    dealsExpired > 0 &&
      `${dealsExpired} ${dealsExpired === 1 ? "pitch" : "pitches"} never answered`,
    foundersOusted > 0 &&
      `${foundersOusted} ${foundersOusted === 1 ? "founder" : "founders"} ousted`,
  ].filter(Boolean) as string[];
  return { rep, drivers };
}
