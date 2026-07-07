import type { Graph } from '../graph/Graph.js';
import { EdgeKind } from '../model/EdgeKind.js';
import { NodeKind } from '../model/NodeKind.js';

/** Finds potentially unused code in the graph. */
export class DeadCodeAnalyzer {
  analyze(graph: Graph): DeadCodeReport {
    const unusedExports: string[] = [];
    const unusedFunctions: string[] = [];
    const unreachableClasses: string[] = [];
    const orphanModules: string[] = [];

    for (const node of graph.getNodes()) {
      const incoming = graph.getIncomingEdges(node.id);
      const hasReferences = incoming.some(
        (e) =>
          e.kind === EdgeKind.IMPORTS ||
          e.kind === EdgeKind.CALLS ||
          e.kind === EdgeKind.REFERENCES ||
          e.kind === EdgeKind.EXTENDS ||
          e.kind === EdgeKind.IMPLEMENTS,
      );

      if (node.metadata['exported'] === true && !hasReferences && incoming.length === 0) {
        unusedExports.push(node.id);
      }

      if (node.kind === NodeKind.Function && !hasReferences) {
        unusedFunctions.push(node.id);
      }

      if (node.kind === NodeKind.Class && !hasReferences) {
        unreachableClasses.push(node.id);
      }

      if (node.kind === NodeKind.File) {
        const imports = graph.getOutgoingEdges(node.id).filter((e) => e.kind === EdgeKind.IMPORTS);
        const importedBy = graph.getIncomingEdges(node.id).filter((e) => e.kind === EdgeKind.IMPORTS);
        if (imports.length === 0 && importedBy.length === 0) {
          orphanModules.push(node.id);
        }
      }
    }

    return { unusedExports, unusedFunctions, unreachableClasses, orphanModules };
  }
}

/** Report of dead/unused code findings. */
export interface DeadCodeReport {
  unusedExports: string[];
  unusedFunctions: string[];
  unreachableClasses: string[];
  orphanModules: string[];
}
