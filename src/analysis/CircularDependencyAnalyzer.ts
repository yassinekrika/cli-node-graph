import type { Graph } from '../graph/Graph.js';
import { GraphAlgorithms } from '../graph/GraphAlgorithms.js';

/** Detects circular dependencies in the graph. */
export class CircularDependencyAnalyzer {
  analyze(graph: Graph): CycleReport[] {
    const algorithms = new GraphAlgorithms(graph);
    const cycles = algorithms.detectCycles();

    return cycles.map((cycle, index) => ({
      id: `cycle-${String(index + 1)}`,
      nodes: cycle,
      length: cycle.length,
      labels: cycle.map((id) => graph.getNode(id)?.label ?? id),
    }));
  }
}

/** Report of a single dependency cycle. */
export interface CycleReport {
  id: string;
  nodes: string[];
  length: number;
  labels: string[];
}
