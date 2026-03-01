import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(currentDir, "..");
const workspaceRoot = path.resolve(cliRoot, "..", "..");
const distRoot = path.join(cliRoot, "dist");
const coreRoot = path.join(workspaceRoot, "packages", "core");

await fs.cp(path.join(coreRoot, "templates"), path.join(distRoot, "templates"), {
  recursive: true
});
await fs.cp(path.join(coreRoot, "modules"), path.join(distRoot, "modules"), {
  recursive: true
});
