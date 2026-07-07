import type { Graph } from '../graph/Graph.js';

/** Exports a graph to a specific format. */
export interface GraphExporter {
  readonly format: string;
  export(graph: Graph): string;
}
