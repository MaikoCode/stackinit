import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { createGenerationPlan, generateProject, normalizeConfig } from "../packages/core/src/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.map(async (tempDir) => {
      await fs.rm(tempDir, { recursive: true, force: true });
    })
  );
  tempDirs.length = 0;
});

describe("createGenerationPlan", () => {
  test("includes Prisma and Better Auth modules when requested", () => {
    const config = normalizeConfig({
      projectName: "auth-app",
      targetDir: "auth-app",
      preset: "next-app",
      backend: "prisma-mysql",
      auth: true,
      shadcn: true,
      packageManager: "pnpm",
      install: false,
      git: false,
      dryRun: false
    });

    const plan = createGenerationPlan(config);

    expect(plan.modules.map((module) => module.id)).toEqual([
      "backend-prisma-mysql",
      "auth-better-auth"
    ]);
  });
});

describe("generateProject", () => {
  test.each([
    {
      preset: "next-app" as const,
      backend: "none" as const,
      auth: false,
      files: ["package.json", "src/app/page.tsx", "README.md"]
    },
    {
      preset: "next-app" as const,
      backend: "prisma-mysql" as const,
      auth: true,
      files: [
        "package.json",
        "prisma/schema.prisma",
        "src/lib/db.ts",
        "src/lib/auth.ts",
        "src/app/api/auth/[...all]/route.ts"
      ]
    },
    {
      preset: "turbo-monorepo" as const,
      backend: "convex" as const,
      auth: false,
      files: [
        "package.json",
        "apps/web/package.json",
        "apps/web/convex/schema.ts",
        "packages/ui/src/index.tsx"
      ]
    },
    {
      preset: "turbo-monorepo" as const,
      backend: "prisma-mongodb" as const,
      auth: false,
      files: [
        "package.json",
        "apps/web/package.json",
        "apps/web/prisma/schema.prisma",
        "apps/web/src/lib/db.ts"
      ]
    }
  ])("writes the expected files for $preset + $backend", async ({ preset, backend, auth, files }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "stackinit-"));
    const targetDir = path.join(root, `${preset}-${backend}`);
    tempDirs.push(root);

    const config = normalizeConfig({
      projectName: path.basename(targetDir),
      targetDir,
      preset,
      backend,
      auth,
      shadcn: true,
      packageManager: "pnpm",
      install: false,
      git: false,
      dryRun: false
    });

    const result = await generateProject(config);

    expect(result.dryRun).toBe(false);

    for (const relativePath of files) {
      await expect(fs.access(path.join(targetDir, relativePath))).resolves.toBeUndefined();
    }

    const readme = await fs.readFile(path.join(targetDir, "README.md"), "utf8");
    expect(readme).toContain("Generated with `stackinit`");
  });

  test("returns a dry-run summary without writing files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "stackinit-"));
    tempDirs.push(root);
    const targetDir = path.join(root, "dry-run-app");

    const config = normalizeConfig({
      projectName: "dry-run-app",
      targetDir,
      preset: "next-app",
      backend: "none",
      auth: false,
      shadcn: true,
      packageManager: "pnpm",
      install: false,
      git: false,
      dryRun: true
    });

    const result = await generateProject(config);

    expect(result.dryRun).toBe(true);
    await expect(fs.access(targetDir)).rejects.toThrow();
  });
});
