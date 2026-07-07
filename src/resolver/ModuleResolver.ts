import { dirname, resolve } from 'node:path';
import ts from 'typescript';
import { toPosixPath } from '../utils/path.js';

/** Resolves module specifiers to absolute file paths. */
export class ModuleResolver {
  resolveImport(
    moduleSpecifier: string,
    containingFile: string,
    program: ts.Program,
  ): string | undefined {
    const resolved = ts.resolveModuleName(
      moduleSpecifier,
      containingFile,
      program.getCompilerOptions(),
      ts.sys,
    );
    if (resolved.resolvedModule) {
      return toPosixPath(resolved.resolvedModule.resolvedFileName);
    }
    return undefined;
  }

  isPackageImport(moduleSpecifier: string): boolean {
    return !moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/');
  }

  getPackageName(moduleSpecifier: string): string {
    if (moduleSpecifier.startsWith('@')) {
      const parts = moduleSpecifier.split('/');
      return parts.slice(0, 2).join('/');
    }
    return moduleSpecifier.split('/')[0] ?? moduleSpecifier;
  }
}

/** Resolves file system paths relative to project root. */
export class PathResolver {
  constructor(private readonly projectRoot: string) {}

  toAbsolute(relativePath: string): string {
    return toPosixPath(resolve(this.projectRoot, relativePath));
  }

  toRelative(absolutePath: string): string {
    return toPosixPath(resolve(absolutePath)).replace(
      toPosixPath(resolve(this.projectRoot)) + '/',
      '',
    );
  }

  folderPath(filePath: string): string {
    return toPosixPath(dirname(filePath));
  }
}
