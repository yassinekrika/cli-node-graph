import type { Graph } from '../graph/Graph.js';
import type { GraphExporter } from './GraphExporter.js';

/** Exports graph as GraphML XML. */
export class GraphMLExporter implements GraphExporter {
  readonly format = 'graphml';

  export(graph: Graph): string {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
      '  <key id="label" for="node" attr.name="label" attr.type="string"/>',
      '  <key id="kind" for="node" attr.name="kind" attr.type="string"/>',
      '  <key id="edgeKind" for="edge" attr.name="kind" attr.type="string"/>',
      '  <graph id="G" edgedefault="directed">',
    ];

    for (const node of graph.getNodes()) {
      lines.push(
        `    <node id="${escapeXml(node.id)}">`,
        `      <data key="label">${escapeXml(node.label)}</data>`,
        `      <data key="kind">${escapeXml(node.kind)}</data>`,
        '    </node>',
      );
    }

    for (const edge of graph.getEdges()) {
      lines.push(
        `    <edge source="${escapeXml(edge.source)}" target="${escapeXml(edge.target)}">`,
        `      <data key="edgeKind">${escapeXml(edge.kind)}</data>`,
        '    </edge>',
      );
    }

    lines.push('  </graph>', '</graphml>');
    return lines.join('\n');
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
