import path from "node:path";

import { describe, expect, test } from "vitest";

import { normalizeConfig, sanitizeProjectName } from "../packages/core/src/index.js";

describe("sanitizeProjectName", () => {
  test("normalizes user input into a safe slug", () => {
    expect(sanitizeProjectName("My Stack App")).toBe("my-stack-app");
  });

  test("prefixes names that start with a number", () => {
    expect(sanitizeProjectName("123 starter")).toBe("app-123-starter");
  });
});

describe("normalizeConfig", () => {
  test("rejects auth when the backend is not Prisma", () => {
    expect(() =>
      normalizeConfig(
        {
          projectName: "demo-app",
          targetDir: "demo-app",
          preset: "next-app",
          backend: "convex",
          auth: true,
          shadcn: true,
          packageManager: "pnpm",
          install: false,
          git: false,
          dryRun: false
        },
        process.cwd()
      )
    ).toThrow(/Better Auth is only supported/);
  });

  test("resolves the absolute target directory", () => {
    const cwd = path.join(process.cwd(), "tmp");
    const config = normalizeConfig(
      {
        projectName: "demo-app",
        targetDir: "demo-app",
        preset: "next-app",
        backend: "none",
        auth: false,
        shadcn: true,
        packageManager: "pnpm",
        install: false,
        git: false,
        dryRun: false
      },
      cwd
    );

    expect(config.targetDir).toBe(path.join(cwd, "demo-app"));
    expect(config.projectTitle).toBe("Demo App");
  });
});
