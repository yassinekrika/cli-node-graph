import type { Graph } from '../graph/Graph.js';
import { EdgeKind } from '../model/EdgeKind.js';

/** Analyzes dependency relationships between nodes. */
export class DependencyAnalyzer {
  analyze(graph: Graph): DependencyReport {
    const importEdges = graph.getEdgesByKind(EdgeKind.IMPORTS);
    const callEdges = graph.getEdgesByKind(EdgeKind.CALLS);
    const fileImportCounts = new Map<string, number>();

    for (const edge of importEdges) {
      fileImportCounts.set(edge.source, (fileImportCounts.get(edge.source) ?? 0) + 1);
    }

    const tightlyCoupled = [...fileImportCounts.entries()]
      .filter(([, count]) => count >= 5)
      .map(([id, count]) => ({
        nodeId: id,
        importCount: count,
        label: graph.getNode(id)?.label ?? id,
      }))
      .sort((a, b) => b.importCount - a.importCount);

    return {
      totalImports: importEdges.length,
      totalCalls: callEdges.length,
      tightlyCoupled,
    };
  }
}

/** Summary of dependency relationships. */
export interface DependencyReport {
  totalImports: number;
  totalCalls: number;
  tightlyCoupled: { nodeId: string; importCount: number; label: string }[];
}
