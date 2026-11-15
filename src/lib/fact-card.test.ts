import { describe, it, expect } from "vitest";
import {
  generateCard,
  fillTemplate,
  signalTone,
  FACT_POOL,
  EXCLUSION_PAIRS,
  SENTIMENT_WEIGHT,
} from "@/lib/fact-card";

describe("generateCard", () => {
  it("returns 4 filled fact strings with no leftover placeholders", () => {
    for (let i = 0; i < 50; i++) {
      const card = generateCard();
      expect(card.length).toBe(4);
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

describe("signalTone", () => {
  it("recovers every fact's direction from its filled-in text", () => {
    for (const fact of FACT_POOL) {
      const weight = SENTIMENT_WEIGHT[fact.sentiment_tag];
      const expected = weight > 0 ? "good" : weight < 0 ? "bad" : "neutral";
      expect(signalTone(fillTemplate(fact)), fact.id).toBe(expected);
    }
    expect(signalTone("a clue from an older pool")).toBeNull();
  });
});
