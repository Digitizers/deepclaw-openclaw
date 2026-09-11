import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf8")
);

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), "openclaw.plugin.json"), "utf8")
);

describe("OpenClaw package metadata", () => {
  it("ships compiled runtime output for OpenClaw plugin discovery", () => {
    expect(packageJson.files).toContain("dist/**");
    expect(packageJson.openclaw.runtimeExtensions).toEqual(["./dist/index.js"]);
  });

  it("targets the split plugin SDK used by OpenClaw 2026.9.4", () => {
    expect(packageJson.devDependencies.openclaw).toBe("2026.9.4");
    expect(packageJson.peerDependencies.openclaw).toBe("2026.7.1-2 || >=2026.5.6");
    expect(packageJson.openclaw.build.openclawVersion).toBe("2026.9.4");
    expect(packageJson.openclaw.compat.minGatewayVersion).toBe("2026.5.6");
  });

  it("keeps TypeScript source extensions for marketplace metadata", () => {
    expect(packageJson.openclaw.extensions).toEqual(["./index.ts"]);
  });

  it("can be installed disabled before a DeepClaw sync token exists", () => {
    expect(manifest.configSchema.required ?? []).not.toContain("syncToken");
  });

  it("loads on gateway startup so its LLM hooks can register", () => {
    expect(manifest.activation).toEqual({ onStartup: true });
  });
});
