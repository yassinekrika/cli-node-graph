import type { EdgeKind } from '../model/EdgeKind.js';
import type { EdgeMetadata, GraphEdge } from '../model/GraphEdge.js';
import { edgeId } from '../utils/id.js';

/** Factory for creating consistently structured graph edges. */
export class EdgeFactory {
  create(params: {
    source: string;
    target: string;
    kind: EdgeKind;
    metadata?: EdgeMetadata;
    idOverride?: string;
  }): GraphEdge {
    const id =
      params.idOverride ?? edgeId(params.source, params.target, params.kind);

    return {
      id,
      source: params.source,
      target: params.target,
      kind: params.kind,
      metadata: params.metadata ?? {},
    };
  }
}
