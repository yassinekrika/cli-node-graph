import type { NodeKind } from './NodeKind.js';

/** Source location range within a file. */
export interface SourceRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/** Arbitrary metadata attached to a graph node. */
export type NodeMetadata = Record<string, string | number | boolean | string[] | undefined>;

/** A node in the codebase knowledge graph. */
export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  file?: string;
  line?: number;
  column?: number;
  range?: SourceRange;
  metadata: NodeMetadata;
}
