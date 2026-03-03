# stackinit

`stackinit` is a local-first app generator for bootstrapping Next.js and Turborepo projects with optional Prisma, Convex, Better Auth, and shadcn-flavored UI.

## Current status

- CLI build works
- unit and generator tests pass
- local smoke builds were verified for:
  - `next-app + prisma-mysql + better-auth`
  - `next-app + prisma-mongodb`
  - `next-app + convex`
  - `turbo-monorepo + none`
  - `turbo-monorepo + prisma-mysql + better-auth`
  - `turbo-monorepo + prisma-mongodb`
  - `turbo-monorepo + convex`

## Cleanup

Remove local smoke artifacts with:

```powershell
pnpm clean:artifacts
```

## Local development

Install and build the workspace:

```powershell
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

Run the CLI directly:

```powershell
node packages/cli/dist/index.js my-app
```

Run interactive mode:

```powershell
node packages/cli/dist/index.js
```

Run non-interactive mode:

```powershell
node packages/cli/dist/index.js my-app --yes --preset next-app --backend prisma-mysql --auth --skip-git
```

## Local smoke tests

Run a verified single-app scenario:

```powershell
pnpm smoke:next-auth
```

Other single-app scenarios:

```powershell
pnpm smoke:next-mongo
pnpm smoke:next-convex
```

Run a verified monorepo scenario:

```powershell
pnpm smoke:turbo
```

Other monorepo scenarios:

```powershell
pnpm smoke:turbo-auth
pnpm smoke:turbo-mongo
pnpm smoke:turbo-convex
```

Run both:

```powershell
pnpm smoke:all
```

Run the full matrix without dependency installs or builds inside generated apps:

```powershell
pnpm smoke:all:fast
```

Run a direct ad hoc structure-only smoke check:

```powershell
node .\scripts\smoke-test.mjs next-auth --skip-install
```

Each smoke test:

- builds the CLI
- generates a project in a temp directory
- installs dependencies inside the generated project
- runs `pnpm build`
- leaves the generated project on disk and prints its path

## Test from a tarball before publishing

Build and pack the CLI:

```powershell
pnpm pack:cli
```

Smoke-test the packed tarball end to end:

```powershell
pnpm smoke:tarball
```

This writes a tarball inside [packages/cli](/C:/Users/Maikoke/Desktop/stackinit/packages/cli).

Then test it from another folder:

```powershell
npx C:\Users\Maikoke\Desktop\stackinit\packages\cli\stackinit-0.1.0.tgz my-app
```

## Publish checklist

1. Run `pnpm clean:artifacts`
2. Run `pnpm test`
3. Run `pnpm typecheck`
4. Run `pnpm smoke:all`
5. Run `pnpm pack:cli`
6. Test the tarball with `npx <path-to-tgz>`
7. Publish from `packages/cli`

## Notes

- Better Auth is intentionally limited to Prisma-backed projects in v1.
- The generated Prisma projects may still require you to run your normal Prisma/Better Auth generation steps after scaffolding.
- The CLI package now bundles the core engine and copies template assets into the published `dist` folder so local tarball testing matches npm behavior.
- The smoke runner accepts `--skip-install` for fast file-generation checks and `--source tarball` to execute the packed npm tarball instead of the local `dist` entrypoint.
