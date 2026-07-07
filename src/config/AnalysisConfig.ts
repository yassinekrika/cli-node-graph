/** Analysis configuration options. */
export interface AnalysisConfig {
  /** Root path of the project to analyze. */
  projectRoot: string;
  /** Path to tsconfig.json (relative to project root or absolute). */
  tsconfigPath?: string;
  /** Exclude patterns for source files. */
  exclude?: string[];
  /** Layer rules for layer violation analysis. */
  layers?: LayerRule[];
  /** Enable worker thread analysis (future). */
  useWorkers?: boolean;
}

/** A layer rule defining allowed dependency direction. */
export interface LayerRule {
  name: string;
  pattern: string;
  allowedImports?: string[];
}

/** Default analysis configuration. */
export const DEFAULT_CONFIG: Partial<AnalysisConfig> = {
  tsconfigPath: 'tsconfig.json',
  exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
};
