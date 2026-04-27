import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { DeepClawConfig } from "./config.js";
import { calculateCost } from "./pricing.js";

/**
 * One LLM call record — captured from llm_output hook.
 * usage.total comes directly from the provider (not estimated).
 */
export interface LlmRecord {
  runId: string;
  sessionId: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  cacheRead: number;
  cacheWrite: number;
  thinkingTokens: number;  // thinking/reasoning tokens (Gemini thoughtsTokenCount, OpenAI reasoning_tokens)
  /** Calculated cost in USD */
  costUsd: number;
  costSource: "table" | "unknown";
  /** Per-component breakdown */
  costBreakdown?: { input: number; output: number; cacheRead: number; cacheWrite: number; thinking: number; };
  timestamp: number;
}

/** Aggregated per-session totals */
interface SessionAccumulator {
  sessionId: string;
  records: LlmRecord[];
  startedAt: number;
  lastSeenAt: number;
}

export function createDeepClawService(api: OpenClawPluginApi, config: DeepClawConfig) {
  const logger = api.logger;
  const sessions = new Map<string, SessionAccumulator>();
  let flushTimer: ReturnType<typeof setInterval> | undefined;

  // ─── helpers ────────────────────────────────────────────────────

  function getOrCreateSession(sessionId: string): SessionAccumulator {
    let acc = sessions.get(sessionId);
    if (!acc) {
      acc = { sessionId, records: [], startedAt: Date.now(), lastSeenAt: Date.now() };
      sessions.set(sessionId, acc);
    }
    acc.lastSeenAt = Date.now();
    return acc;
  }

  async function postToDeepClaw(path: string, body: unknown): Promise<void> {
    const url = `${config.apiUrl.replace(/\/$/, "")}${path}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.syncToken}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        logger.warn(`[deepclaw] POST ${path} → ${res.status}: ${await res.text().catch(() => "")}`);
      }
    } catch (err) {
      logger.warn(`[deepclaw] POST ${path} failed: ${String(err)}`);
    }
  }

  async function flushSession(sessionId: string, reason: "session_end" | "periodic"): Promise<void> {
    const acc = sessions.get(sessionId);
    if (!acc || acc.records.length === 0) return;

    const totalCostUsd = acc.records.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
    const totalIn = acc.records.reduce((sum, r) => sum + r.tokensIn, 0);
    const totalOut = acc.records.reduce((sum, r) => sum + r.tokensOut, 0);
    const totalCacheRead = acc.records.reduce((sum, r) => sum + r.cacheRead, 0);
    const totalCacheWrite = acc.records.reduce((sum, r) => sum + r.cacheWrite, 0);
    const totalThinking = acc.records.reduce((sum, r) => sum + r.thinkingTokens, 0);

    const payload = {
      instanceId: config.instanceId,
      sessionId,
      flushReason: reason,
      llmCalls: acc.records,
      summary: {
        totalCostUsd,
        costSource: acc.records.some((r) => r.costSource === "table") ? "table" : "unknown",
        totalTokensIn: totalIn,
        totalTokensOut: totalOut,
        totalCacheRead,
        totalCacheWrite,
        totalThinkingTokens: totalThinking,
        callCount: acc.records.length,
        startedAt: acc.startedAt,
        lastSeenAt: acc.lastSeenAt,
      },
    };

    if (config.debug) {
      logger.info(`[deepclaw] flushing session ${sessionId}: ${acc.records.length} calls, $${totalCostUsd.toFixed(6)}`);
    }

    await postToDeepClaw("/api/sync/session", payload);

    if (reason === "session_end") {
      sessions.delete(sessionId);
    } else {
      // Keep session alive but clear records to avoid double-counting
      acc.records = [];
    }
  }

  async function flushAll(reason: "periodic"): Promise<void> {
    const ids = Array.from(sessions.keys());
    await Promise.all(ids.map((id) => flushSession(id, reason)));
  }

  // ─── public ─────────────────────────────────────────────────────

  return {
    registerHooks() {
      // Capture actual cost from provider on every LLM completion
      api.on("llm_output", async (event) => {
        const tokensIn  = event.usage?.input     ?? 0;
        const tokensOut = event.usage?.output    ?? 0;
        const cacheRead = event.usage?.cacheRead ?? 0;
        const cacheWrite = event.usage?.cacheWrite ?? 0;

        // Try multiple paths — OpenClaw may expose it under different field names
        const thinkingTokens =
          (event.usage as any)?.thinking ??
          (event.usage as any)?.thoughtsTokenCount ??
          (event.usage as any)?.reasoning ??
          (event as any)?.rawResponse?.usageMetadata?.thoughtsTokenCount ??
          0;

        const cost = calculateCost({
          model: event.model,
          inputTokens: tokensIn,
          outputTokens: tokensOut,
          cacheReadTokens: cacheRead,
          cacheWriteTokens: cacheWrite,
          thinkingTokens,
        });

        const record: LlmRecord = {
          runId: event.runId,
          sessionId: event.sessionId,
          provider: event.provider,
          model: event.model,
          tokensIn,
          tokensOut,
          cacheRead,
          cacheWrite,
          thinkingTokens,
          costUsd: cost.totalCost,
          costSource: cost.priceSource,
          costBreakdown: cost.priceSource === "table" ? {
            input: cost.inputCost,
            output: cost.outputCost,
            cacheRead: cost.cacheReadCost,
            cacheWrite: cost.cacheWriteCost,
            thinking: cost.thinkingCost,
          } : undefined,
          timestamp: Date.now(),
        };

        const acc = getOrCreateSession(event.sessionId);
        acc.records.push(record);

        if (config.debug) {
          logger.info(
            `[deepclaw] llm_output session=${event.sessionId} model=${event.model} ` +
            `in=${tokensIn} out=${tokensOut} cacheRead=${cacheRead} thinking=${thinkingTokens} ` +
            `cost=$${record.costUsd.toFixed(6)} source=${record.costSource}`
          );
        }
      });

      // Flush & close on session end
      api.on("session_end", async (event) => {
        await flushSession(event.sessionId, "session_end");
      });

      // Start periodic flush timer
      flushTimer = setInterval(() => {
        flushAll("periodic").catch((err) => {
          logger.warn(`[deepclaw] periodic flush error: ${String(err)}`);
        });
      }, config.flushIntervalMs);
    },

    async shutdown() {
      if (flushTimer) clearInterval(flushTimer);
      // Final flush of all open sessions
      const ids = Array.from(sessions.keys());
      await Promise.all(ids.map((id) => flushSession(id, "session_end")));
    },
  };
}
