#!/usr/bin/env node
import fs from 'node:fs';

const packagePath = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const slug = process.env.CLAWHUB_PACKAGE || pkg.name;
const expectedVersion = process.env.EXPECTED_VERSION || pkg.version;
const registryBase = (process.env.CLAWHUB_REGISTRY || 'https://clawhub.ai/api/v1').replace(/\/$/, '');
const url = `${registryBase}/packages/${encodeURIComponent(slug)}`;

const response = await fetch(url, {
  headers: {
    accept: 'application/json',
    'user-agent': 'deepclaw-openclaw-ci/1.0',
  },
});

if (!response.ok) {
  const body = await response.text().catch(() => '');
  throw new Error(`ClawHub lookup failed for ${slug}: HTTP ${response.status} ${response.statusText}${body ? `\n${body.slice(0, 500)}` : ''}`);
}

const payload = await response.json();
const remoteVersion = payload?.package?.latestVersion || payload?.latestVersion || payload?.package?.tags?.latest;

if (!remoteVersion) {
  throw new Error(`ClawHub response for ${slug} did not include package.latestVersion`);
}

console.log(`package.json version: ${expectedVersion}`);
console.log(`ClawHub latest:      ${remoteVersion}`);
console.log(`ClawHub package:     ${url}`);

if (remoteVersion !== expectedVersion) {
  const message = `ClawHub is out of sync: ${slug} is ${remoteVersion} on ClawHub, but package.json is ${expectedVersion}. Publish the current package to ClawHub before considering the release complete.`;
  if (process.env.CLAWHUB_VERSION_CHECK_MODE === 'warn') {
    console.log(`::warning::${message}`);
  } else {
    throw new Error(message);
  }
}
