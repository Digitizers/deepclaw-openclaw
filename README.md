# deepclaw-openclaw

OpenClaw plugin — real-time LLM cost & usage tracking to DeepClaw.

## Why this plugin?

OpenClaw's default cost tracking relies on LiteLLM's pricing tables.  
Preview/experimental models (e.g. `gemini-3-flash-preview`) don't exist in those tables → cost = $0.

This plugin hooks directly into `llm_output` — which receives **actual cost** from the provider API — and streams it to DeepClaw in real-time.

## Installation

```bash
npm install deepclaw-openclaw
```

For local development, copy this directory to `~/.openclaw/extensions/deepclaw-openclaw/`.

Then configure in your OpenClaw agent config:

```yaml
plugins:
  deepclaw-openclaw:
    enabled: true
    syncToken: "YOUR_DEEPCLAW_TOKEN"
    instanceId: "srv1234567"          # your instance name in DeepClaw
    apiUrl: "https://app.deep-claw.com"   # or self-hosted URL
    flushIntervalMs: 5000            # batch flush interval
    debug: false
```

Or via environment variables:
- `DEEPCLAW_SYNC_TOKEN`
- `DEEPCLAW_INSTANCE_ID`
- `DEEPCLAW_API_URL`

## How it works

| Hook | Action |
|------|--------|
| `llm_output` | Captures actual cost + tokens from provider response |
| `session_end` | Flushes accumulated records to `/api/sync/session` |
| periodic timer | Flush every `flushIntervalMs` ms (default 5s) |

### costSource field

- `"actual"` — provider returned real cost in usage
- `"unknown"` — no cost in provider response (will be estimated server-side)
