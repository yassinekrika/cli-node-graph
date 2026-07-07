import type { Graph } from '../graph/Graph.js';
import type { GraphExporter } from './GraphExporter.js';

/** Exports graph as JSON. */
export class JsonExporter implements GraphExporter {
  readonly format = 'json';

  export(graph: Graph): string {
    return JSON.stringify(
      {
        nodes: graph.getNodes(),
        edges: graph.getEdges(),
        meta: {
          nodeCount: graph.nodeCount,
          edgeCount: graph.edgeCount,
          exportedAt: new Date().toISOString(),
        },
      },
      null,
      2,
    );
  }
}
