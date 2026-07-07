import type { Graph } from '../graph/Graph.js';
import type { GraphExporter } from './GraphExporter.js';

/** Exports graph as Graphviz DOT format. */
export class DotExporter implements GraphExporter {
  readonly format = 'dot';

  export(graph: Graph): string {
    const lines: string[] = ['digraph CodeGraph {', '  rankdir=LR;', '  node [shape=box];'];

    for (const node of graph.getNodes()) {
      const label = `${node.label}\\n(${node.kind})`;
      lines.push(`  "${node.id}" [label="${label}"];`);
    }

    for (const edge of graph.getEdges()) {
      lines.push(`  "${edge.source}" -> "${edge.target}" [label="${edge.kind}"];`);
    }

    lines.push('}');
    return lines.join('\n');
  }
}

/** Exports graph as Mermaid diagram. */
export class MermaidExporter implements GraphExporter {
  readonly format = 'mermaid';

  export(graph: Graph): string {
    const lines: string[] = ['graph LR'];
    const nodeIds = new Map<string, string>();

    graph.getNodes().forEach((node, i) => {
      const shortId = `N${String(i)}`;
      nodeIds.set(node.id, shortId);
      lines.push(`  ${shortId}["${node.label}<br/>${node.kind}"]`);
    });

    for (const edge of graph.getEdges()) {
      const src = nodeIds.get(edge.source);
      const tgt = nodeIds.get(edge.target);
      if (src && tgt) {
        lines.push(`  ${src} -->|${edge.kind}| ${tgt}`);
      }
    }

    return lines.join('\n');
  }
}
