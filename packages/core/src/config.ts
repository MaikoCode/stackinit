import path from "node:path";

import { z } from "zod";

import { BACKENDS, PRESETS, type StackInitConfig } from "./types.js";

const projectNamePattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

const baseSchema = z.object({
  projectName: z.string().min(1),
  targetDir: z.string().min(1),
  preset: z.enum(PRESETS),
  backend: z.enum(BACKENDS),
  auth: z.boolean(),
  shadcn: z.boolean().default(true),
  packageManager: z.literal("pnpm").default("pnpm"),
  install: z.boolean().default(true),
  git: z.boolean().default(true),
  dryRun: z.boolean().default(false)
});

export type RawStackInitConfig = z.input<typeof baseSchema>;

export function sanitizeProjectName(input: string): string {
  const sanitized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_ ]+/g, "")
    .replace(/[ _]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!sanitized) {
    throw new Error("Project name must include letters or numbers.");
  }

  const normalized =
    sanitized[0] !== undefined && /^[0-9]/.test(sanitized[0])
      ? `app-${sanitized}`
      : sanitized;

  if (!projectNamePattern.test(normalized)) {
    throw new Error(
      "Project name must contain only lowercase letters, numbers, dashes, or underscores."
    );
  }

  return normalized;
}

export function toProjectTitle(projectName: string): string {
  return projectName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(" ");
}

export function validateProjectDirectory(targetDir: string, cwd = process.cwd()) {
  return path.resolve(cwd, targetDir);
}

export function normalizeConfig(
  input: RawStackInitConfig,
  cwd = process.cwd()
): StackInitConfig {
  const parsed = baseSchema.parse(input);
  const projectSlug = sanitizeProjectName(parsed.projectName);
  const targetDir = validateProjectDirectory(parsed.targetDir, cwd);
  const projectScope = projectSlug.replace(/_/g, "-");

  if (parsed.auth && !parsed.backend.startsWith("prisma")) {
    throw new Error(
      "Better Auth is only supported with Prisma backends in v1. Choose Prisma MySQL or Prisma MongoDB."
    );
  }

  return {
    ...parsed,
    projectName: projectSlug,
    projectSlug,
    projectScope,
    projectTitle: toProjectTitle(projectSlug),
    targetDir
  };
}
