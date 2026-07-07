import { createHash } from 'node:crypto';

/** Create a stable hash-based id from parts. */
export function hashId(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16);
}

/** Build a node id from kind, file, and name. */
export function nodeId(kind: string, file: string, name: string, line?: number): string {
  const linePart = line !== undefined ? String(line) : '';
  return `${kind}:${hashId(file, name, linePart)}`;
}

/** Build an edge id from source, target, and kind. */
export function edgeId(source: string, target: string, kind: string): string {
  return `edge:${hashId(source, target, kind)}`;
}
