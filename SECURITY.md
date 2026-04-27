# Security Policy

## Supported Versions

Security fixes are handled on the latest `main` branch until the first stable release line is established.

## Reporting a Vulnerability

Please do **not** open public GitHub issues for secrets, authentication bypasses, or data exposure reports.

Report privately via one of these channels:

- GitHub Security Advisory: https://github.com/Digitizers/deepclaw-openclaw/security/advisories/new
- Email: ben@digitizer.co.il

Please include:

- Affected version or commit SHA
- Reproduction steps
- Expected vs. actual behavior
- Any relevant logs with secrets redacted

## Secret Handling

This plugin uses a DeepClaw sync token for outbound telemetry. Never commit:

- `DEEPCLAW_SYNC_TOKEN`
- `.env` files
- OpenClaw runtime config containing credentials
- Session dumps or raw provider responses that may include user data
