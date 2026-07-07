import type { Graph } from '../graph/Graph.js';
import type { GraphExporter } from './GraphExporter.js';

/** Exports graph as Cytoscape.js JSON. */
export class CytoscapeExporter implements GraphExporter {
  readonly format = 'cytoscape';

  export(graph: Graph): string {
    const elements = [
      {
        data: {
          id: '__graph__',
          label: 'cli-node-graph',
          kind: 'Graph',
        },
        group: 'nodes' as const,
      },
      ...graph.getNodes().map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          kind: node.kind,
          file: node.file,
          ...node.metadata,
        },
        group: 'nodes' as const,
      })),
      ...graph.getEdges().map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          kind: edge.kind,
          ...edge.metadata,
        },
        group: 'edges' as const,
      })),
    ];

    return JSON.stringify({ elements }, null, 2);
  }
}

/** Exports graph as React Flow JSON. */
export class ReactFlowExporter implements GraphExporter {
  readonly format = 'reactflow';

  export(graph: Graph): string {
    const nodes = graph.getNodes().map((node, index) => ({
      id: node.id,
      type: 'default',
      position: { x: (index % 20) * 200, y: Math.floor(index / 20) * 100 },
      data: {
        label: node.label,
        kind: node.kind,
        file: node.file,
        line: node.line,
        metadata: node.metadata,
      },
    }));

    const edges = graph.getEdges().map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.kind,
      data: edge.metadata,
    }));

    return JSON.stringify({ nodes, edges }, null, 2);
  }
}

/** Exports graph as Neo4j CSV (nodes + relationships). */
export class Neo4jExporter implements GraphExporter {
  readonly format = 'neo4j';

  export(graph: Graph): string {
    const nodeLines = [
      'id:ID,label,kind,file,line,:LABEL',
      ...graph.getNodes().map(
        (n) =>
          `${csvEscape(n.id)},${csvEscape(n.label)},${csvEscape(n.kind)},${csvEscape(n.file ?? '')},${n.line ?? ''},Node`,
      ),
    ];

    const edgeLines = [
      ':START_ID,:END_ID,kind,:TYPE',
      ...graph.getEdges().map(
        (e) => `${csvEscape(e.source)},${csvEscape(e.target)},${csvEscape(e.kind)},${e.kind}`,
      ),
    ];

    return `# Nodes\n${nodeLines.join('\n')}\n\n# Relationships\n${edgeLines.join('\n')}`;
  }
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
