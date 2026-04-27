# Contributing

Thanks for improving `deepclaw-openclaw`.

## Local setup

```bash
npm install
npm run ci
```

## Pull request checklist

Before opening a PR, verify:

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm pack --dry-run` includes only intended files
- [ ] No `.env`, tokens, OpenClaw runtime state, or session data are committed
- [ ] README/config docs are updated when behavior changes

## Pricing changes

When adding or changing model pricing:

1. Prefer official provider pricing pages.
2. Add or update tests for cache/reasoning/tier behavior.
3. Mention the source and date in code comments or PR notes.

## Release process

Publishing to npm or ClaWHub is done by maintainers only after explicit approval.
