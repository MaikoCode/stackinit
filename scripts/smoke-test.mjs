import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");
const cliEntry = path.join(workspaceRoot, "packages", "cli", "dist", "index.js");
const cliPackageDir = path.join(workspaceRoot, "packages", "cli");

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

const { scenarioName, skipInstall, source } = parseArgs(process.argv.slice(2));

if (!(scenarioName in scenarios)) {
  throw new Error(`Unknown scenario "${scenarioName}".`);
}

const scenario = scenarios[scenarioName];
const smokeRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stackinit-smoke-"));
const generatorArgs = [
  scenario.name,
  ...scenario.args,
  ...(skipInstall ? ["--skip-install"] : [])
];

console.log(`Smoke source: ${source}`);
console.log(`Skip install: ${skipInstall ? "yes" : "no"}`);

console.log(`Smoke root: ${smokeRoot}`);

if (source === "dist") {
  await run("node", [cliEntry, ...generatorArgs], smokeRoot);
} else {
  const tarballPath = await findLatestTarball();
  console.log(`Tarball: ${tarballPath}`);
  await run("npx", ["--yes", "--package", tarballPath, "stackinit", ...generatorArgs], smokeRoot);
}

const generatedDir = path.join(smokeRoot, scenario.name);
await verifyScaffold(generatedDir);

if (!skipInstall) {
  await run("pnpm", ["build"], generatedDir);
}

console.log(`Generated app kept at: ${generatedDir}`);

function parseArgs(args) {
  const [scenarioArg = "next-auth", ...rest] = args;
  let skipInstall = false;
  let source = "dist";

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--skip-install") {
      skipInstall = true;
      continue;
    }

    if (arg === "--source") {
      source = rest[index + 1] ?? source;
      index += 1;
      continue;
    }

    if (arg.startsWith("--source=")) {
      source = arg.slice("--source=".length);
      continue;
    }

    throw new Error(`Unknown option "${arg}".`);
  }

  if (source !== "dist" && source !== "tarball") {
    throw new Error(`Unknown source "${source}". Expected "dist" or "tarball".`);
  }

  return {
    scenarioName: scenarioArg,
    skipInstall,
    source
  };
}

async function findLatestTarball() {
  const entries = await fs.readdir(cliPackageDir, { withFileTypes: true });
  const tarballs = entries
    .filter((entry) => entry.isFile() && /^stackinit-.*\.tgz$/.test(entry.name))
    .map((entry) => path.join(cliPackageDir, entry.name));

  if (tarballs.length === 0) {
    throw new Error(`No CLI tarball found in ${cliPackageDir}. Run "pnpm pack:cli" first.`);
  }

  const tarballsWithStats = await Promise.all(
    tarballs.map(async (tarballPath) => ({
      tarballPath,
      stats: await fs.stat(tarballPath)
    }))
  );

  tarballsWithStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs);

  return tarballsWithStats[0].tarballPath;
}

async function verifyScaffold(generatedDir) {
  const packageJsonPath = path.join(generatedDir, "package.json");
  const readmePath = path.join(generatedDir, "README.md");

  await fs.access(packageJsonPath);
  await fs.access(readmePath);
}

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
