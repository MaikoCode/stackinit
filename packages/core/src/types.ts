export const PRESETS = ["next-app", "turbo-monorepo"] as const;
export const BACKENDS = [
  "none",
  "convex",
  "prisma-mysql",
  "prisma-mongodb"
] as const;

export type Preset = (typeof PRESETS)[number];
export type Backend = (typeof BACKENDS)[number];

export interface StackInitConfig {
  projectName: string;
  projectSlug: string;
  projectScope: string;
  projectTitle: string;
  targetDir: string;
  preset: Preset;
  backend: Backend;
  auth: boolean;
  shadcn: boolean;
  packageManager: "pnpm";
  install: boolean;
  git: boolean;
  dryRun: boolean;
}

export interface PackageJsonFragment {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface TemplateModule {
  id: string;
  filesDir: string;
  packageJsonFragments?: Record<string, PackageJsonFragment>;
  envVars?: Record<string, Record<string, string>>;
  readmeNotes?: string[];
  replacements?: Record<string, string>;
}

export interface GenerationPlan {
  config: StackInitConfig;
  baseTemplateDir: string;
  modules: TemplateModule[];
}

export interface GenerateProjectOptions {
  cwd?: string;
}

export interface GenerationResult {
  targetDir: string;
  modules: string[];
  installRan: boolean;
  gitInitialized: boolean;
  dryRun: boolean;
  readmePath: string;
}
