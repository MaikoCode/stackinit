import { intro, outro, cancel, confirm, isCancel, note, select, spinner, text } from "@clack/prompts";
import pc from "picocolors";
import { parseArgs } from "node:util";

import { createGenerationPlan, generateProject, normalizeConfig, type Backend, type Preset } from "@stackinit/core";

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      preset: { type: "string" },
      backend: { type: "string" },
      auth: { type: "boolean" },
      "no-auth": { type: "boolean" },
      shadcn: { type: "boolean" },
      "no-shadcn": { type: "boolean" },
      yes: { type: "boolean" },
      "skip-install": { type: "boolean" },
      "skip-git": { type: "boolean" },
      "dry-run": { type: "boolean" }
    }
  });

  intro(pc.bold("stackinit"));

  try {
    const projectName =
      positionals[0] ??
      (await promptText("Project name", "my-stack-app", "Name your project directory."));

    const preset = (values.preset as Preset | undefined) ?? (await promptPreset(Boolean(values.yes)));
    const backend =
      (values.backend as Backend | undefined) ?? (await promptBackend(Boolean(values.yes)));

    const authValue = resolveBooleanFlag(values.auth, values["no-auth"]);
    const auth =
      authValue ?? (await promptAuth(backend, Boolean(values.yes)));
    const shadcn =
      resolveBooleanFlag(values.shadcn, values["no-shadcn"]) ??
      (Boolean(values.yes) ? true : await promptConfirm("Include shadcn starter UI?", true));
    const install = Boolean(values["skip-install"]) ? false : Boolean(values.yes) ? true : await promptConfirm("Install dependencies now?", true);
    const git = Boolean(values["skip-git"]) ? false : Boolean(values.yes) ? true : await promptConfirm("Initialize a git repository?", true);

    const config = normalizeConfig({
      projectName,
      targetDir: projectName,
      preset,
      backend,
      auth,
      shadcn,
      install,
      git,
      dryRun: Boolean(values["dry-run"])
    });

    const plan = createGenerationPlan(config);
    note(
      [
        `Preset: ${config.preset}`,
        `Backend: ${config.backend}`,
        `Auth: ${config.auth ? "better-auth" : "none"}`,
        `Modules: ${plan.modules.map((module) => module.id).join(", ") || "base only"}`
      ].join("\n"),
      config.dryRun ? "Dry run" : "Resolved stack"
    );

    const progress = spinner();
    progress.start(config.dryRun ? "Resolving generation plan" : "Scaffolding project");
    const result = await generateProject(config);
    progress.stop(config.dryRun ? "Dry run complete" : "Project created");

    outro(
      [
        `${pc.bold(config.projectTitle)} is ready at ${pc.cyan(result.targetDir)}.`,
        config.dryRun ? "No files were written." : `Next: ${pc.cyan(`cd ${config.projectName}`)} && ${pc.cyan("pnpm dev")}`
      ].join("\n")
    );
  } catch (error) {
    cancel(error instanceof Error ? error.message : "stackinit failed.");
    process.exitCode = 1;
  }
}

async function promptPreset(useDefault: boolean): Promise<Preset> {
  if (useDefault) {
    return "next-app";
  }

  const response = await select({
    message: "What do you want to generate?",
    options: [
      { value: "next-app", label: "Next.js app", hint: "Single app with App Router" },
      { value: "turbo-monorepo", label: "Turbo monorepo", hint: "Next.js app plus shared workspace package" }
    ]
  });

  return handlePrompt(response) as Preset;
}

async function promptBackend(useDefault: boolean): Promise<Backend> {
  if (useDefault) {
    return "none";
  }

  const response = await select({
    message: "Which backend setup do you want?",
    options: [
      { value: "none", label: "None", hint: "Keep the app lightweight" },
      { value: "convex", label: "Convex", hint: "Managed backend with official client tooling" },
      { value: "prisma-mysql", label: "Prisma + MySQL", hint: "Relational database workflow" },
      { value: "prisma-mongodb", label: "Prisma + MongoDB", hint: "Document database workflow" }
    ]
  });

  return handlePrompt(response) as Backend;
}

async function promptAuth(backend: Backend, useDefault: boolean): Promise<boolean> {
  if (backend === "none" || backend === "convex") {
    note(
      "Better Auth is only enabled for Prisma backends in v1. This project will be generated without auth.",
      "Auth"
    );
    return false;
  }

  if (useDefault) {
    return false;
  }

  return promptConfirm("Include Better Auth?", false);
}

async function promptConfirm(message: string, initialValue: boolean) {
  const response = await confirm({
    message,
    initialValue
  });

  return handlePrompt(response) as boolean;
}

async function promptText(message: string, placeholder: string, description?: string) {
  const response = await text({
    message,
    placeholder,
    defaultValue: placeholder,
    validate(value) {
      if (!value?.trim()) {
        return "A project name is required.";
      }

      return undefined;
    }
  });

  if (description) {
    note(description, "Project");
  }

  return handlePrompt(response) as string;
}

function resolveBooleanFlag(onValue: boolean | undefined, offValue: boolean | undefined) {
  if (onValue && offValue) {
    throw new Error("Choose either the positive or negative form of a boolean flag, not both.");
  }

  if (onValue) {
    return true;
  }

  if (offValue) {
    return false;
  }

  return undefined;
}

function handlePrompt<T>(value: T) {
  if (isCancel(value)) {
    cancel("Operation cancelled.");
    process.exit(0);
  }

  return value;
}

void main();
