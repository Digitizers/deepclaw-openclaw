---
name: deepclaw-openclaw
description: OpenClaw observability plugin for DeepClaw — streams real-time LLM usage, token, cache, reasoning, and cost telemetry into DeepClaw.
version: 0.1.0
author: Ben Kalsky / Digitizers
license: MIT
tags:
  - openclaw
  - plugin
  - observability
  - deepclaw
  - llm-costs
  - llm-observability
  - cost-tracking
---

# DeepClaw OpenClaw Plugin

`deepclaw-openclaw` is an OpenClaw plugin that sends LLM usage telemetry from OpenClaw to DeepClaw.

## What it tracks

- Provider and model
- Input/output tokens
- Cache read/write tokens
- Reasoning/thinking tokens
- Per-call and per-session cost breakdowns
- `costSource` metadata for auditability

## Install

```bash
npm install deepclaw-openclaw
```

npm package: https://www.npmjs.com/package/deepclaw-openclaw
GitHub: https://github.com/Digitizers/deepclaw-openclaw

## Configure

```yaml
plugins:
  deepclaw-openclaw:
    enabled: true
    syncToken: "YOUR_DEEPCLAW_SYNC_TOKEN"
    instanceId: "prod-agent-01"
    apiUrl: "https://app.deep-claw.com"
    flushIntervalMs: 5000
    debug: false
```

Environment variables are also supported:

- `DEEPCLAW_SYNC_TOKEN`
- `DEEPCLAW_INSTANCE_ID`
- `DEEPCLAW_API_URL`

## Status

Initial public release candidate: `0.1.0`.

For full documentation, see the repository README.
