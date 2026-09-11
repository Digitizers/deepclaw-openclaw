# Changelog

All notable changes to this project will be documented here.

## 0.1.5 - Plugin API range correction

- Use the single-comparator plugin API range accepted by OpenClaw 2026.9 while retaining the npm peer range needed by the deployed prerelease-tagged host.

## 0.1.4 - OpenClaw 2026.9 compatibility

- Import plugin APIs from the supported `openclaw/plugin-sdk/core` entrypoint.
- Build and test against OpenClaw 2026.9.4 on Node.js 26.
- Keep compatibility with gateway releases from 2026.5.6 onward and the deployed 2026.7.1-2 build.

## 0.1.2 - GitHub Packages publishing prep

- Add GitHub Actions workflow support for publishing to npmjs and GitHub Packages.
- Document the scoped GitHub Packages install path as `@digitizers/deepclaw-openclaw`.

## 0.1.1 - Metadata cleanup

- Mark `syncToken` as required in the OpenClaw plugin config schema for clearer marketplace/security metadata.
- Update README ownership line to Digitizer with the official website link.

## 0.1.0 - Public release candidate

- Initial OpenClaw plugin package metadata.
- DeepClaw plugin manifest.
- Runtime service for `llm_output` and `session_end` telemetry.
- Provider-aware pricing table with cache and reasoning token support.
- TypeScript validation, Vitest tests, and package dry-run workflow.
