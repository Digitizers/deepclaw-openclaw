/**
 * LLM pricing table — cost per 1M tokens in USD.
 * Source: official provider pricing pages (updated 2025-04).
 *
 * For Gemini: step-function tiered pricing (NOT graduated).
 * If promptTokenCount exceeds the threshold, ALL tokens are billed at the higher rate.
 */

export interface ModelPricing {
  inputPerM: number;
  outputPerM: number;
  cacheReadPerM?: number;
  cacheWritePerM?: number;
  /** If set, all tokens are billed at higher rates when promptTokens > this */
  tierThreshold?: number;
  inputPerMAboveTier?: number;
  outputPerMAboveTier?: number;
  cacheReadPerMAboveTier?: number;
  /** Separate rate for thinking tokens (e.g. Gemini 2.5) */
  thinkingOutputPerM?: number;
}

const PRICING: Record<string, ModelPricing> = {
  // ── Gemini ───────────────────────────────────────────────────────────────
  "gemini-2.5-flash": {
    inputPerM: 0.15,
    outputPerM: 0.60,
    cacheReadPerM: 0.0375,
    cacheWritePerM: 1.00,
    thinkingOutputPerM: 3.50,
    tierThreshold: 200_000,
    inputPerMAboveTier: 0.30,
    outputPerMAboveTier: 1.20,
    cacheReadPerMAboveTier: 0.075,
  },
  "gemini-2.5-pro": {
    inputPerM: 1.25,
    outputPerM: 10.00,
    cacheReadPerM: 0.31,
    tierThreshold: 200_000,
    inputPerMAboveTier: 2.50,
    outputPerMAboveTier: 15.00,
    cacheReadPerMAboveTier: 0.63,
  },
  "gemini-2.0-flash": {
    inputPerM: 0.10,
    outputPerM: 0.40,
    cacheReadPerM: 0.025,
  },
  "gemini-1.5-pro": {
    inputPerM: 1.25,
    outputPerM: 5.00,
    cacheReadPerM: 0.3125,
    tierThreshold: 128_000,
    inputPerMAboveTier: 2.50,
    outputPerMAboveTier: 10.00,
    cacheReadPerMAboveTier: 0.625,
  },
  "gemini-1.5-flash": {
    inputPerM: 0.075,
    outputPerM: 0.30,
    cacheReadPerM: 0.01875,
    tierThreshold: 128_000,
    inputPerMAboveTier: 0.15,
    outputPerMAboveTier: 0.60,
    cacheReadPerMAboveTier: 0.0375,
  },
  // ── OpenAI ───────────────────────────────────────────────────────────────
  "gpt-4o": { inputPerM: 2.50, outputPerM: 10.00, cacheReadPerM: 1.25 },
  "gpt-4o-mini": { inputPerM: 0.15, outputPerM: 0.60, cacheReadPerM: 0.075 },
  "gpt-4.1": { inputPerM: 2.00, outputPerM: 8.00, cacheReadPerM: 0.50 },
  "gpt-4.1-mini": { inputPerM: 0.40, outputPerM: 1.60, cacheReadPerM: 0.10 },
  "gpt-5": { inputPerM: 10.00, outputPerM: 40.00, cacheReadPerM: 2.50 },
  "gpt-5.4": { inputPerM: 10.00, outputPerM: 40.00, cacheReadPerM: 2.50 },
  "gpt-5.4-mini": { inputPerM: 0.40, outputPerM: 1.60, cacheReadPerM: 0.10 },
  "o3": { inputPerM: 10.00, outputPerM: 40.00, cacheReadPerM: 2.50 },
  "o4-mini": { inputPerM: 1.10, outputPerM: 4.40, cacheReadPerM: 0.275 },
  // ── Anthropic ────────────────────────────────────────────────────────────
  "claude-opus-4": { inputPerM: 15.00, outputPerM: 75.00, cacheReadPerM: 1.50, cacheWritePerM: 18.75 },
  "claude-opus-4-5": { inputPerM: 15.00, outputPerM: 75.00, cacheReadPerM: 1.50, cacheWritePerM: 18.75 },
  "claude-opus-4-6": { inputPerM: 15.00, outputPerM: 75.00, cacheReadPerM: 1.50, cacheWritePerM: 18.75 },
  "claude-sonnet-4": { inputPerM: 3.00, outputPerM: 15.00, cacheReadPerM: 0.30, cacheWritePerM: 3.75 },
  "claude-sonnet-4-5": { inputPerM: 3.00, outputPerM: 15.00, cacheReadPerM: 0.30, cacheWritePerM: 3.75 },
  "claude-sonnet-4-6": { inputPerM: 3.00, outputPerM: 15.00, cacheReadPerM: 0.30, cacheWritePerM: 3.75 },
  "claude-haiku-3-5": { inputPerM: 0.80, outputPerM: 4.00, cacheReadPerM: 0.08, cacheWritePerM: 1.00 },
  // ── DeepSeek ─────────────────────────────────────────────────────────────
  "deepseek-chat": { inputPerM: 0.27, outputPerM: 1.10, cacheReadPerM: 0.07 },
  "deepseek-reasoner": { inputPerM: 0.55, outputPerM: 2.19, cacheReadPerM: 0.14 },
  // ── xAI ──────────────────────────────────────────────────────────────────
  "grok-3": { inputPerM: 3.00, outputPerM: 15.00 },
  "grok-3-mini": { inputPerM: 0.30, outputPerM: 0.50 },
  "grok-2-vision-1212": { inputPerM: 2.00, outputPerM: 10.00 },
};

/** Normalize model name for lookup (strip provider prefix, version suffixes like -latest) */
function normalizeModel(raw: string): string {
  const lower = raw.toLowerCase();
  // Strip provider prefix (e.g. "google/gemini-2.5-flash" → "gemini-2.5-flash")
  const slash = lower.lastIndexOf("/");
  const name = slash >= 0 ? lower.slice(slash + 1) : lower;
  // Strip common suffixes
  return name
    .replace(/-latest$/, "")
    .replace(/-\d{8}$/, "")   // date suffixes like -20241022
    .replace(/-exp$/, "")
    .replace(/-preview$/, "");
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  thinkingCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  totalCost: number;
  priceSource: "table" | "unknown";
  modelKey: string | null;
}

export function calculateCost(opts: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  thinkingTokens?: number;
}): CostBreakdown {
  const key = normalizeModel(opts.model);

  // Try exact match, then prefix match
  let pricing: ModelPricing | undefined = PRICING[key];
  if (!pricing) {
    // Find longest prefix match
    for (const k of Object.keys(PRICING)) {
      if (key.startsWith(k) || k.startsWith(key)) {
        pricing = PRICING[k];
        break;
      }
    }
  }

  if (!pricing) {
    return {
      inputCost: 0, outputCost: 0,
      thinkingCost: 0,
      cacheReadCost: 0, cacheWriteCost: 0,
      totalCost: 0,
      priceSource: "unknown",
      modelKey: null,
    };
  }

  const M = 1_000_000;
  const totalInput = opts.inputTokens;

  // Gemini step-function tier: if total prompt > threshold, ALL tokens at higher rate
  const aboveTier = pricing.tierThreshold && totalInput > pricing.tierThreshold;
  const inputRate = aboveTier ? (pricing.inputPerMAboveTier ?? pricing.inputPerM) : pricing.inputPerM;
  const outputRate = pricing.outputPerM;
  const cacheReadRate = aboveTier
    ? (pricing.cacheReadPerMAboveTier ?? pricing.cacheReadPerM ?? 0)
    : (pricing.cacheReadPerM ?? 0);

  const cacheReadTokens = opts.cacheReadTokens ?? 0;
  const cacheWriteTokens = opts.cacheWriteTokens ?? 0;
  const thinkingTokens = opts.thinkingTokens ?? 0;

  // For cached input: pay cache-read rate instead of full input rate
  const nonCachedInput = Math.max(0, totalInput - cacheReadTokens);
  const inputCost = (nonCachedInput / M) * inputRate;
  const cacheReadCost = (cacheReadTokens / M) * cacheReadRate;
  const cacheWriteCost = (cacheWriteTokens / M) * (pricing.cacheWritePerM ?? inputRate);

  // Thinking vs normal output (additive — Gemini separates candidatesTokenCount and thoughtsTokenCount)
  const outputCost = (opts.outputTokens / M) * outputRate;
  const thinkingCost = pricing.thinkingOutputPerM
    ? (thinkingTokens / M) * pricing.thinkingOutputPerM
    : (thinkingTokens / M) * outputRate;

  const totalCost = inputCost + outputCost + thinkingCost + cacheReadCost + cacheWriteCost;

  return {
    inputCost,
    outputCost,
    thinkingCost,
    cacheReadCost,
    cacheWriteCost,
    totalCost,
    priceSource: "table",
    modelKey: key,
  };
}
