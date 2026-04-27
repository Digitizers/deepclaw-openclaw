# DeepClaw OpenClaw Plugin

[![CI](https://github.com/Digitizers/deepclaw-openclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/Digitizers/deepclaw-openclaw/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-plugin-111827.svg)](https://github.com/Digitizers/deepclaw-openclaw)
[![Category: Observability](https://img.shields.io/badge/category-observability-7c3aed.svg)](https://github.com/Digitizers/deepclaw-openclaw)

**DeepClaw for OpenClaw** streams LLM usage telemetry from OpenClaw into DeepClaw: model, provider, input/output tokens, cache reads/writes, reasoning tokens, and calculated cost breakdowns.

It is built for teams that run multi-provider AI agents and need to know, in near real time, where LLM spend is going.

## Highlights

- **Real-time telemetry** from OpenClaw `llm_output` hooks.
- **Per-session batching** with periodic flush and final `session_end` flush.
- **Token-level breakdowns**: input, output, cache read, cache write, reasoning/thinking tokens.
- **Cost attribution** using a maintained pricing table with explicit `costSource` metadata.
- **Provider-aware pricing** for Gemini, OpenAI, Anthropic, DeepSeek, and xAI models.
- **Safe by default**: disabled until configured with an explicit sync token.
- **Small package surface**: only runtime files, plugin manifest, README, license, changelog, and security policy are published.

## Why this plugin exists

Agent cost tracking often breaks around preview models, cache tokens, reasoning tokens, or provider-specific usage fields. The result is usually either `$0` cost, inflated estimates, or numbers that cannot be audited later.

This plugin captures the raw usage shape exposed by OpenClaw, normalizes the important fields, calculates a structured cost breakdown, and sends it to DeepClaw for long-term analysis.

## Installation

From the public npm registry:

```bash
npm install deepclaw-openclaw
```

From GitHub Packages, once the scoped mirror package has been published:

```bash
# .npmrc
@digitizers:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

npm install @digitizers/deepclaw-openclaw
```

The GitHub Packages build is published as the scoped alias `@digitizers/deepclaw-openclaw`; the canonical npmjs package remains `deepclaw-openclaw` for easier public installation.

For local development or manual installation:

```bash
git clone https://github.com/Digitizers/deepclaw-openclaw.git
cd deepclaw-openclaw
npm install
npm run ci
```

## Configuration

Configure the plugin in your OpenClaw agent config:

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

| Variable | Required | Description |
| --- | --- | --- |
| `DEEPCLAW_SYNC_TOKEN` | Yes | Bearer token used to authenticate with DeepClaw. |
| `DEEPCLAW_INSTANCE_ID` | Recommended | Stable identifier for this OpenClaw runtime. Defaults to `default`. |
| `DEEPCLAW_API_URL` | No | DeepClaw base URL. Defaults to `https://app.deep-claw.com`. |

## Data flow

| OpenClaw hook | What happens |
| --- | --- |
| `llm_output` | Capture provider, model, usage counters, cache counters, reasoning tokens, and calculated cost. |
| Periodic timer | Flush accumulated records every `flushIntervalMs` milliseconds. |
| `session_end` | Flush final session data and clear the local accumulator. |

Payloads are sent to:

```text
POST /api/sync/session
Authorization: Bearer <syncToken>
```

## Cost source semantics

Each LLM record includes `costSource`:

| Value | Meaning |
| --- | --- |
| `table` | Cost was calculated using the plugin's pricing table. |
| `unknown` | No supported pricing entry was found; cost is sent as `0` so DeepClaw can estimate or flag it. |

> Note: usage counters come from OpenClaw/provider response metadata. Dollar cost is calculated locally by this plugin unless OpenClaw adds a trusted provider-cost field in a future hook shape.

## Development

```bash
npm install
npm run typecheck
npm test
npm pack --dry-run
```

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run typecheck` | Strict TypeScript validation. |
| `npm test` | Run Vitest tests. |
| `npm run ci` | Typecheck, test, and dry-run package contents. |
| `npm run smoke` | Run plugin smoke tests. |

## Published package contents

The package is intentionally narrow:

- `index.ts`
- `src/config.ts`
- `src/pricing.ts`
- `src/service.ts`
- `openclaw.plugin.json`
- `README.md`
- `LICENSE`
- `SECURITY.md`
- `CHANGELOG.md`
- `SKILL.md`

## Security

Do not commit sync tokens or OpenClaw runtime state. See [SECURITY.md](SECURITY.md) for reporting and handling guidance.

## Status

`0.1.2` is an initial public release candidate. APIs may still evolve with OpenClaw plugin hook changes.

## License

MIT © Ben Kalsky / [Digitizer](https://digitizer.co.il).
