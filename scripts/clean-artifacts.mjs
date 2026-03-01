import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(currentDir, "..");

const targets = [
  path.join(workspaceRoot, "tmp"),
  path.join(workspaceRoot, "packages", "cli", "smoke-stack")
];

for (const target of targets) {
  await fs.rm(target, { recursive: true, force: true });
}
