import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import type { AnalysisConfig } from '../config/AnalysisConfig.js';
import { toPosixPath } from '../utils/path.js';

/** Result of creating a TypeScript program. */
export interface ProgramResult {
  program: ts.Program;
  checker: ts.TypeChecker;
  sourceFiles: ts.SourceFile[];
  projectRoot: string;
  configPath: string;
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

/** Creates a TypeScript Program from a project's tsconfig. */
export class ProgramFactory {
  create(config: AnalysisConfig): ProgramResult {
    const projectRoot = resolve(config.projectRoot);
    const configPath = resolve(projectRoot, config.tsconfigPath ?? 'tsconfig.json');

    if (!existsSync(configPath)) {
      throw new Error(`tsconfig not found: ${configPath}`);
    }

    const configFile = ts.readConfigFile(configPath, (path) => readFileSync(path, 'utf-8'));
    if (configFile.error) {
      throw new Error(ts.formatDiagnostic(configFile.error, {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: () => dirname(configPath),
        getNewLine: () => '\n',
      }));
    }

    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      dirname(configPath),
      undefined,
      configPath,
    );

    const host = ts.createCompilerHost(parsed.options, true);
    const program = ts.createProgram({
      rootNames: parsed.fileNames,
      options: parsed.options,
      host,
    });

    const checker = program.getTypeChecker();
    const excludePatterns = config.exclude ?? [];

    const sourceFiles = program
      .getSourceFiles()
      .filter((sf) => !sf.isDeclarationFile)
      .filter((sf) => SOURCE_EXTENSIONS.has(getExtension(sf.fileName)))
      .filter((sf) => !shouldExclude(sf.fileName, excludePatterns));

    return {
      program,
      checker,
      sourceFiles,
      projectRoot,
      configPath,
    };
  }
}

function getExtension(fileName: string): string {
  const match = /\.(tsx?|mts|cts)$/.exec(fileName);
  return match?.[0] ?? '';
}

function shouldExclude(filePath: string, patterns: string[]): boolean {
  const normalized = toPosixPath(filePath);
  return patterns.some((pattern) => {
    const regex = globToRegex(pattern);
    return regex.test(normalized);
  });
}

function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(escaped);
}
