import { describe, it, expect } from "vitest";
import { generateCard, FACT_POOL, EXCLUSION_PAIRS } from "@/lib/fact-card";

describe("generateCard", () => {
  it("returns 3-5 filled fact strings with no leftover placeholders", () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      expect(card.length).toBeGreaterThanOrEqual(3);
      expect(card.length).toBeLessThanOrEqual(5);
      for (const line of card) expect(line).not.toMatch(/\{.*\}/);
    }
  });

  it("never draws both facts of an exclusion pair", () => {
    for (let i = 0; i < 200; i++) {
      const card = generateCard();
      for (const [a, b] of EXCLUSION_PAIRS) {
        const textA = FACT_POOL.find((f) => f.id === a)?.text_template.split("{")[0];
        const textB = FACT_POOL.find((f) => f.id === b)?.text_template.split("{")[0];
        const hasA = card.some((line) => textA && line.startsWith(textA));
        const hasB = card.some((line) => textB && line.startsWith(textB));
        expect(hasA && hasB).toBe(false);
      }
    }
  });
});
