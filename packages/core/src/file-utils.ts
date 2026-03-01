import type { Dirent } from "node:fs";
import fs from "fs-extra";
import path from "node:path";

import type { PackageJsonFragment } from "./types.js";

const textExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".prisma",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml"
]);

export async function ensureEmptyDirectory(targetDir: string) {
  const exists = await fs.pathExists(targetDir);

  if (!exists) {
    return;
  }

  const entries = await fs.readdir(targetDir);

  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }
}

export async function copyDirectory(sourceDir: string, targetDir: string) {
  await fs.copy(sourceDir, targetDir, { overwrite: true });
}

export async function mergePackageJson(
  filePath: string,
  fragment: PackageJsonFragment
) {
  const packageJson = (await fs.readJson(filePath)) as Record<string, unknown>;

  packageJson.scripts = {
    ...(packageJson.scripts as Record<string, string> | undefined),
    ...fragment.scripts
  };
  packageJson.dependencies = sortRecord({
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...fragment.dependencies
  });
  packageJson.devDependencies = sortRecord({
    ...(packageJson.devDependencies as Record<string, string> | undefined),
    ...fragment.devDependencies
  });

  await fs.writeJson(filePath, packageJson, { spaces: 2 });
}

export async function appendEnvFile(
  filePath: string,
  entries: Record<string, string>
) {
  const existing = (await fs.pathExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";
  const existingKeys = new Set(
    existing
      .split(/\r?\n/g)
      .map((line: string) => line.trim())
      .filter(Boolean)
      .filter((line: string) => !line.startsWith("#"))
      .map((line: string) => line.split("=")[0]!)
  );

  const additions = Object.entries(entries)
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, value]) => `${key}=${value}`);

  const nextContent = [existing.trimEnd(), ...additions].filter(Boolean).join("\n");
  await fs.outputFile(filePath, `${nextContent}\n`);
}

export async function replacePlaceholdersInTree(
  rootDir: string,
  replacements: Record<string, string>
) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry: Dirent) => {
      const fullPath = path.join(rootDir, entry.name);

      if (entry.isDirectory()) {
        await replacePlaceholdersInTree(fullPath, replacements);
        return;
      }

      if (!isTextFile(fullPath)) {
        return;
      }

      const content = await fs.readFile(fullPath, "utf8");
      const nextContent = Object.entries(replacements).reduce(
        (accumulator, [token, value]) => accumulator.split(token).join(value),
        content
      );

      if (nextContent !== content) {
        await fs.writeFile(fullPath, nextContent);
      }
    })
  );
}

function isTextFile(filePath: string) {
  return textExtensions.has(path.extname(filePath));
}

function sortRecord(
  record: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!record || Object.keys(record).length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right))
  );
}
