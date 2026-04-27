import { describe, expect, it } from "vitest";
import { calculateCost } from "../pricing.js";

describe("gemini-2.5-flash pricing", () => {
  it("gemini-2.5-flash thinking rate is $3.50/1M not $10.50", () => {
    const r = calculateCost({ model: "gemini-2.5-flash", inputTokens: 0, outputTokens: 0, thinkingTokens: 1_000_000 });
    expect(r.totalCost).toBeCloseTo(3.50, 4);
  });

  it("gemini-2.5-flash tiered input pricing above 200k", () => {
    const r = calculateCost({ model: "gemini-2.5-flash", inputTokens: 250_000, outputTokens: 0 });
    // above tier: 0.30/1M → 250k * 0.30/1M = $0.075
    expect(r.totalCost).toBeCloseTo(0.075, 5);
  });

  it("gemini-2.5-flash tiered output pricing above 200k prompt tokens", () => {
    const r = calculateCost({ model: "gemini-2.5-flash", inputTokens: 250_000, outputTokens: 1_000_000 });
    // input = 250k * $0.30/1M = $0.075, output = 1M * $1.20/1M = $1.20
    expect(r.totalCost).toBeCloseTo(1.275, 5);
  });

  it("thinking tokens are additive not subtractive from output", () => {
    // outputTokens = 1M (candidatesTokenCount), thinkingTokens = 0.5M (thoughtsTokenCount)
    const r = calculateCost({ model: "gemini-2.5-flash", inputTokens: 0, outputTokens: 1_000_000, thinkingTokens: 500_000 });
    // output = 1M * $0.60 = $0.60
    // thinking = 0.5M * $3.50 = $1.75
    // total = $2.35
    expect(r.totalCost).toBeCloseTo(2.35, 4);
  });
});

describe("model normalization", () => {
  it("uses the longest matching model key for provider-prefixed aliases", () => {
    const r = calculateCost({ model: "google/gemini-2.5-flash-preview", inputTokens: 1_000_000, outputTokens: 0 });
    expect(r.priceSource).toBe("table");
    expect(r.modelKey).toBe("gemini-2.5-flash");
  });

  it("marks unsupported models as unknown instead of guessing", () => {
    const r = calculateCost({ model: "unknown-provider/future-model", inputTokens: 1_000_000, outputTokens: 1_000_000 });
    expect(r.priceSource).toBe("unknown");
    expect(r.totalCost).toBe(0);
  });
});
