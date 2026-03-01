import path from "node:path";
import { spawn } from "node:child_process";

import fs from "fs-extra";

import { ensureEmptyDirectory, copyDirectory, mergePackageJson, appendEnvFile, replacePlaceholdersInTree } from "./file-utils.js";
import { resolveBaseTemplateDir, resolveModules } from "./modules.js";
import { buildReadme } from "./readme.js";
import type { GenerateProjectOptions, GenerationPlan, GenerationResult, StackInitConfig, TemplateModule } from "./types.js";

type InternalModule = TemplateModule & { replacements?: Record<string, string> };

export function createGenerationPlan(config: StackInitConfig): GenerationPlan {
  return {
    config,
    baseTemplateDir: resolveBaseTemplateDir(config),
    modules: resolveModules(config)
  };
}

export async function generateProject(
  config: StackInitConfig,
  options: GenerateProjectOptions = {}
): Promise<GenerationResult> {
  const plan = createGenerationPlan(config);

  if (config.dryRun) {
    return {
      targetDir: config.targetDir,
      modules: plan.modules.map((module) => module.id),
      installRan: false,
      gitInitialized: false,
      dryRun: true,
      readmePath: path.join(config.targetDir, "README.md")
    };
  }

  await ensureEmptyDirectory(config.targetDir);
  await copyDirectory(plan.baseTemplateDir, config.targetDir);

  for (const module of plan.modules as InternalModule[]) {
    if (await fs.pathExists(module.filesDir)) {
      await copyDirectory(module.filesDir, config.targetDir);
    }
  }

  const replacements = buildReplacements(config, plan.modules as InternalModule[]);
  await replacePlaceholdersInTree(config.targetDir, replacements);

  for (const module of plan.modules) {
    if (!module.packageJsonFragments) {
      continue;
    }

    for (const [relativePath, fragment] of Object.entries(module.packageJsonFragments)) {
      await mergePackageJson(path.join(config.targetDir, relativePath), fragment);
    }
  }

  for (const module of plan.modules) {
    if (!module.envVars) {
      continue;
    }

    for (const [relativePath, entries] of Object.entries(module.envVars)) {
      await appendEnvFile(path.join(config.targetDir, relativePath), entries);
    }
  }

  await fs.writeFile(path.join(config.targetDir, "README.md"), buildReadme(plan));

  if (config.install) {
    await runCommand("pnpm", ["install"], config.targetDir);
  }

  if (config.git) {
    await runCommand("git", ["init"], config.targetDir, "ignore");
  }

  return {
    targetDir: config.targetDir,
    modules: plan.modules.map((module) => module.id),
    installRan: config.install,
    gitInitialized: config.git,
    dryRun: false,
    readmePath: path.join(config.targetDir, "README.md")
  };
}

function buildReplacements(
  config: StackInitConfig,
  modules: InternalModule[]
): Record<string, string> {
  const baseReplacements: Record<string, string> = {
    "__PROJECT_NAME__": config.projectName,
    "__PROJECT_SLUG__": config.projectSlug,
    "__PROJECT_SCOPE__": config.projectScope,
    "__PROJECT_TITLE__": config.projectTitle
  };

  for (const module of modules) {
    if (!module.replacements) {
      continue;
    }

    Object.assign(baseReplacements, module.replacements);
  }

  return baseReplacements;
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
  stdio: "inherit" | "ignore" = "inherit"
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio,
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
