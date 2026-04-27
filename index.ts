// DeepClaw OpenClaw Plugin — real-time LLM cost & usage tracking
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { createDeepClawService } from "./src/service.js";
import { parseDeepClawConfig } from "./src/config.js";

const plugin = {
  id: "deepclaw-openclaw",
  name: "DeepClaw",
  description: "Export real-time LLM cost & usage data to DeepClaw analytics",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    const config = parseDeepClawConfig(api.pluginConfig);
    if (!config.enabled || !config.syncToken) {
      api.logger.info(
        "[deepclaw] plugin loaded but disabled (set enabled=true and syncToken in config)"
      );
      return;
    }
    const service = createDeepClawService(api, config);
    service.registerHooks();
    api.logger.info(`[deepclaw] started — tracking to ${config.apiUrl}`);
  },
};

export default plugin;
