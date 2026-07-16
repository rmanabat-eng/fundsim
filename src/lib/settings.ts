import { prisma } from "@/lib/prisma";

// The fund's knobs live in a single row (id 1), created on first read with
// the schema defaults ($10M fund, 15 companies).
export async function getSettings() {
  return prisma.fundSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {},
  });
}
