import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  noExternal: ["@stackinit/core"],
  external: ["fs-extra", "zod"],
  banner: {
    js: "#!/usr/bin/env node"
  }
});
