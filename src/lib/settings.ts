import { prisma } from "@/lib/prisma";
import { getVisitorId } from "@/lib/visitor";

// The fund's knobs live in one row per visitor, created on first read with
// the schema defaults ($10M fund, 15 companies).
export async function getSettings() {
  const visitorId = await getVisitorId();
  return prisma.fundSettings.upsert({
    where: { visitorId },
    update: {},
    create: { visitorId },
  });
}
