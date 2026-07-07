import type { Graph } from '../graph/Graph.js';
import { GraphAlgorithms } from '../graph/GraphAlgorithms.js';

/** Analyzes downstream impact of changing a node. */
export class ImpactAnalyzer {
  analyze(graph: Graph, nodeId: string): ImpactReport {
    const node = graph.getNode(nodeId);
    if (!node) {
      return { source: nodeId, affected: [], affectedCount: 0, depth: 0 };
    }

    const algorithms = new GraphAlgorithms(graph);
    const affected = [...algorithms.reverseDependencies(nodeId)];
    const depth = algorithms.dependencyDepth(nodeId);

    return {
      source: nodeId,
      sourceLabel: node.label,
      affected,
      affectedCount: affected.length,
      depth,
      affectedLabels: affected.map((id) => graph.getNode(id)?.label ?? id),
    };
  }

  analyzeByFile(graph: Graph, filePath: string): ImpactReport[] {
    const fileNodes = graph.getNodesByFile(filePath);
    return fileNodes.map((n) => this.analyze(graph, n.id));
  }
}

/** Report of downstream impact from a change. */
export interface ImpactReport {
  source: string;
  sourceLabel?: string;
  affected: string[];
  affectedCount: number;
  depth: number;
  affectedLabels?: string[];
}
