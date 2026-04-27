export interface DeepClawConfig {
  enabled: boolean;
  apiUrl: string;
  syncToken: string;
  instanceId: string;
  flushIntervalMs: number;
  debug: boolean;
}

export function parseDeepClawConfig(raw: unknown): DeepClawConfig {
  const cfg = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled: cfg["enabled"] !== false && cfg["enabled"] !== undefined
      ? Boolean(cfg["enabled"])
      : false,
    apiUrl: String(cfg["apiUrl"] ?? process.env["DEEPCLAW_API_URL"] ?? "https://app.deep-claw.com"),
    syncToken: String(cfg["syncToken"] ?? process.env["DEEPCLAW_SYNC_TOKEN"] ?? ""),
    instanceId: String(cfg["instanceId"] ?? process.env["DEEPCLAW_INSTANCE_ID"] ?? "default"),
    flushIntervalMs: Number(cfg["flushIntervalMs"] ?? 5000),
    debug: Boolean(cfg["debug"] ?? false),
  };
}
