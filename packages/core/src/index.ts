export { normalizeConfig, sanitizeProjectName } from "./config.js";
export { createGenerationPlan, generateProject } from "./generator.js";
export type {
  Backend,
  GenerateProjectOptions,
  GenerationPlan,
  GenerationResult,
  Preset,
  StackInitConfig,
  TemplateModule
} from "./types.js";
