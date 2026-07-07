import { dirname, normalize, relative, resolve, sep } from 'node:path';

/** Normalize a path to forward slashes. */
export function toPosixPath(filePath: string): string {
  return normalize(filePath).split(sep).join('/');
}

/** Get the folder path for a file. */
export function folderOf(filePath: string): string {
  return toPosixPath(dirname(filePath));
}

/** Resolve a path relative to a base directory. */
export function resolveFrom(base: string, target: string): string {
  return toPosixPath(resolve(base, target));
}

/** Get relative path from root. */
export function relativeTo(root: string, filePath: string): string {
  return toPosixPath(relative(root, filePath));
}
