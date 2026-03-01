import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");
const cliEntry = path.join(workspaceRoot, "packages", "cli", "dist", "index.js");

const scenarios = {
  "next-auth": {
    name: "smoke-next-auth",
    args: [
      "--yes",
      "--preset",
      "next-app",
      "--backend",
      "prisma-mysql",
      "--auth",
      "--skip-git"
    ]
  },
  "next-mongo": {
    name: "smoke-next-mongo",
    args: [
      "--yes",
      "--preset",
      "next-app",
      "--backend",
      "prisma-mongodb",
      "--skip-git"
    ]
  },
  "next-convex": {
    name: "smoke-next-convex",
    args: [
      "--yes",
      "--preset",
      "next-app",
      "--backend",
      "convex",
      "--skip-git"
    ]
  },
  "turbo-basic": {
    name: "smoke-turbo-basic",
    args: [
      "--yes",
      "--preset",
      "turbo-monorepo",
      "--backend",
      "none",
      "--skip-git"
    ]
  },
  "turbo-auth": {
    name: "smoke-turbo-auth",
    args: [
      "--yes",
      "--preset",
      "turbo-monorepo",
      "--backend",
      "prisma-mysql",
      "--auth",
      "--skip-git"
    ]
  },
  "turbo-mongo": {
    name: "smoke-turbo-mongo",
    args: [
      "--yes",
      "--preset",
      "turbo-monorepo",
      "--backend",
      "prisma-mongodb",
      "--skip-git"
    ]
  },
  "turbo-convex": {
    name: "smoke-turbo-convex",
    args: [
      "--yes",
      "--preset",
      "turbo-monorepo",
      "--backend",
      "convex",
      "--skip-git"
    ]
  }
};

const targetScenario = process.argv[2] ?? "next-auth";

if (!(targetScenario in scenarios)) {
  throw new Error(`Unknown scenario "${targetScenario}".`);
}

const scenario = scenarios[targetScenario];
const smokeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stackinit-smoke-"));

console.log(`Smoke root: ${smokeRoot}`);

await run("node", [cliEntry, scenario.name, ...scenario.args], smokeRoot);

const generatedDir = path.join(smokeRoot, scenario.name);

await run("pnpm", ["build"], generatedDir);

console.log(`Generated app kept at: ${generatedDir}`);

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32"
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}.`));
    });
  });
}
