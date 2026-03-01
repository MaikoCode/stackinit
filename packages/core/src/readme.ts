import type { GenerationPlan, StackInitConfig } from "./types.js";

export function buildReadme(plan: GenerationPlan) {
  const { config } = plan;
  const envPath = config.preset === "next-app" ? ".env.local" : "apps/web/.env.local";
  const envExamplePath =
    config.preset === "next-app" ? ".env.example" : "apps/web/.env.example";
  const backendLabel = toBackendLabel(config);
  const moduleNotes = plan.modules.flatMap((module) => module.readmeNotes ?? []);
  const scripts = buildScripts(config);
  const nextSteps = buildNextSteps(config);

  return `# ${config.projectTitle}

Generated with \`stackinit\`.

## Stack summary

- Preset: ${config.preset === "next-app" ? "Next.js app" : "Turbo monorepo"}
- Backend: ${backendLabel}
- Auth: ${config.auth ? "Better Auth" : "None"}
- UI: shadcn-style starter components included
- Package manager: pnpm

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

1. Install dependencies${config.install ? " (already done if you kept install enabled)." : ":"}
2. Copy \`${envExamplePath}\` to \`${envPath}\`
3. Update the environment variables for your local setup
4. Start development with \`pnpm dev\`

## Available scripts

${scripts.map((script) => `- \`${script}\``).join("\n")}

## Backend notes

${moduleNotes.length > 0 ? moduleNotes.map((note) => `- ${note}`).join("\n") : "- No backend selected."}

## Next steps

${nextSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`;
}

function toBackendLabel(config: StackInitConfig) {
  switch (config.backend) {
    case "convex":
      return "Convex";
    case "prisma-mysql":
      return "Prisma + MySQL";
    case "prisma-mongodb":
      return "Prisma + MongoDB";
    default:
      return "None";
  }
}

function buildScripts(config: StackInitConfig) {
  const scripts = ["pnpm dev", "pnpm build", "pnpm lint"];

  if (config.backend.startsWith("prisma")) {
    scripts.push("pnpm db:generate", "pnpm db:push", "pnpm db:studio");
  }

  if (config.backend === "convex") {
    scripts.push("pnpm convex:dev");
  }

  if (config.auth) {
    scripts.push("pnpm auth:generate");
  }

  return scripts;
}

function buildNextSteps(config: StackInitConfig) {
  const steps: string[] = [];

  if (!config.install) {
    steps.push("Run `pnpm install`.");
  }

  steps.push("Copy the example environment file and fill in the required values.");

  if (config.auth) {
    steps.push("Run `pnpm auth:generate` before the first database push.");
  }

  if (config.backend.startsWith("prisma")) {
    steps.push("Run `pnpm db:generate` and then `pnpm db:push`.");
  }

  if (config.backend === "convex") {
    steps.push("Run `pnpm convex:dev` in a separate terminal to connect Convex.");
  }

  steps.push("Start the app with `pnpm dev`.");
  return steps;
}
