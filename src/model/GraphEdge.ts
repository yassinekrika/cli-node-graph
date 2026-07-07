import type { EdgeKind } from './EdgeKind.js';

/** Confidence level for inferred relationships. */
export type EdgeConfidence = 'high' | 'medium' | 'low';

/** Arbitrary metadata attached to a graph edge. */
export type EdgeMetadata = Record<string, string | number | boolean | string[] | undefined>;

/** An edge in the codebase knowledge graph. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  metadata: EdgeMetadata;
}

/** Standard edge metadata fields. */
export interface EdgeLocationMetadata extends EdgeMetadata {
  file?: string;
  line?: number;
  column?: number;
  confidence?: EdgeConfidence;
  static?: boolean;
}
