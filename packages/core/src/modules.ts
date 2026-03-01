import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import type { StackInitConfig, TemplateModule } from "./types.js";
import { TOOL_VERSIONS } from "./versions.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = resolveAssetsRoot(currentDir);

export function resolveBaseTemplateDir(config: StackInitConfig) {
  return path.join(
    assetsRoot,
    "templates",
    config.preset === "next-app" ? "next-app-base" : "turbo-monorepo-base"
  );
}

export function resolveModules(config: StackInitConfig): TemplateModule[] {
  const modules: TemplateModule[] = [];

  if (config.backend === "convex") {
    modules.push(
      defineModule("backend-convex", config, {
        packageJsonFragments:
          config.preset === "next-app"
            ? {
                "package.json": {
                  dependencies: {
                    convex: TOOL_VERSIONS.convex
                  },
                  scripts: {
                    "convex:dev": "convex dev"
                  }
                }
              }
            : {
                "package.json": {
                  scripts: {
                    "convex:dev": `pnpm --filter @${config.projectScope}/web exec convex dev`
                  }
                },
                "apps/web/package.json": {
                  dependencies: {
                    convex: TOOL_VERSIONS.convex
                  }
                }
              },
        envVars:
          config.preset === "next-app"
            ? {
                ".env.example": {
                  NEXT_PUBLIC_CONVEX_URL: "https://your-deployment.convex.cloud"
                }
              }
            : {
                "apps/web/.env.example": {
                  NEXT_PUBLIC_CONVEX_URL: "https://your-deployment.convex.cloud"
                }
              },
        readmeNotes: [
          "Convex files are scaffolded, but you still need to run `pnpm convex:dev` and connect a deployment."
        ]
      })
    );
  }

  if (config.backend === "prisma-mysql" || config.backend === "prisma-mongodb") {
    const isMongo = config.backend === "prisma-mongodb";
    const dbType = isMongo ? "mongodb" : "mysql";
    const dbUrl = isMongo
      ? "mongodb+srv://USER:PASSWORD@cluster.example.mongodb.net/stackinit"
      : "mysql://USER:PASSWORD@localhost:3306/stackinit";
    const schemaDir = config.preset === "next-app" ? "single" : "turbo";
    const envPath = config.preset === "next-app" ? ".env.example" : "apps/web/.env.example";
    const packageTarget = config.preset === "next-app" ? "package.json" : "apps/web/package.json";

    modules.push(
      defineModule(`backend-${config.backend}`, config, {
        customDir: path.join(
          assetsRoot,
          "modules",
          "backend",
          config.backend,
          schemaDir
        ),
        packageJsonFragments: {
          [packageTarget]: {
            dependencies: {
              "@prisma/client": TOOL_VERSIONS.prismaClient
            },
            devDependencies: {
              prisma: TOOL_VERSIONS.prisma
            },
            scripts:
              config.preset === "next-app"
                ? {
                    "db:generate": "prisma generate",
                    "db:push": "prisma db push",
                    "db:studio": "prisma studio"
                  }
                : {}
          },
          ...(config.preset === "turbo-monorepo"
            ? {
                "package.json": {
                  scripts: {
                    "db:generate": `pnpm --filter @${config.projectScope}/web exec prisma generate --schema prisma/schema.prisma`,
                    "db:push": `pnpm --filter @${config.projectScope}/web exec prisma db push --schema prisma/schema.prisma`,
                    "db:studio": `pnpm --filter @${config.projectScope}/web exec prisma studio --schema prisma/schema.prisma`
                  }
                }
              }
            : {})
        },
        envVars: {
          [envPath]: {
            DATABASE_URL: dbUrl
          }
        },
        readmeNotes: [
          `Prisma is configured for ${dbType}. Update \`DATABASE_URL\` before running the database scripts.`
        ]
      })
    );
  }

  if (config.auth) {
    const provider = config.backend === "prisma-mongodb" ? "mongodb" : "mysql";
    modules.push(
      defineModule("auth-better-auth", config, {
        customDir: path.join(
          assetsRoot,
          "modules",
          "auth",
          "better-auth",
          config.preset === "next-app" ? "single" : "turbo"
        ),
        packageJsonFragments:
          config.preset === "next-app"
            ? {
                "package.json": {
                  dependencies: {
                    "better-auth": TOOL_VERSIONS.betterAuth
                  },
                  scripts: {
                    "auth:generate": "pnpm exec auth generate --config src/lib/auth.ts"
                  }
                }
              }
            : {
                "package.json": {
                  scripts: {
                    "auth:generate": `pnpm --filter @${config.projectScope}/web exec auth generate --config src/lib/auth.ts`
                  }
                },
                "apps/web/package.json": {
                  dependencies: {
                    "better-auth": TOOL_VERSIONS.betterAuth
                  }
                }
              },
        envVars:
          config.preset === "next-app"
            ? {
                ".env.example": {
                  BETTER_AUTH_SECRET: "replace-with-a-long-random-secret",
                  BETTER_AUTH_URL: "http://localhost:3000"
                }
              }
            : {
                "apps/web/.env.example": {
                  BETTER_AUTH_SECRET: "replace-with-a-long-random-secret",
                  BETTER_AUTH_URL: "http://localhost:3000"
                }
              },
        readmeNotes: [
          "Better Auth files are wired in. After installing dependencies, run `pnpm auth:generate` once so the auth schema is added to Prisma."
        ],
        replacements: {
          "__BETTER_AUTH_PROVIDER__": provider
        }
      })
    );
  }

  return modules;
}

function defineModule(
  id: string,
  config: StackInitConfig,
  options: {
    customDir?: string;
    packageJsonFragments?: TemplateModule["packageJsonFragments"];
    envVars?: TemplateModule["envVars"];
    readmeNotes?: string[];
    replacements?: Record<string, string>;
  }
): TemplateModule {
  const variant = config.preset === "next-app" ? "single" : "turbo";
  const baseDir = options.customDir
    ? options.customDir
    : path.join(assetsRoot, "modules", ...id.split("-"), variant);

  return {
    id,
    filesDir: baseDir,
    packageJsonFragments: options.packageJsonFragments,
    envVars: options.envVars,
    readmeNotes: options.readmeNotes,
    replacements: options.replacements
  };
}

function resolveAssetsRoot(startDir: string) {
  const candidates = [
    startDir,
    path.resolve(startDir, ".."),
    path.resolve(startDir, "..", "..")
  ];

  for (const candidate of candidates) {
    if (
      fs.existsSync(path.join(candidate, "templates")) &&
      fs.existsSync(path.join(candidate, "modules"))
    ) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate stackinit assets from ${startDir}`);
}
