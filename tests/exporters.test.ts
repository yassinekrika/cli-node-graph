import { describe, it, expect } from 'vitest';
import { DotExporter, MermaidExporter } from '../src/exporters/DotExporter.js';
import { GraphMLExporter } from '../src/exporters/GraphMLExporter.js';
import { CytoscapeExporter, ReactFlowExporter, Neo4jExporter } from '../src/exporters/CytoscapeExporter.js';
import { Graph } from '../src/graph/Graph.js';
import { NodeFactory } from '../src/graph/NodeFactory.js';
import { EdgeFactory } from '../src/graph/EdgeFactory.js';
import { NodeKind } from '../src/model/NodeKind.js';
import { EdgeKind } from '../src/model/EdgeKind.js';

function sampleGraph(): Graph {
  const graph = new Graph();
  const nf = new NodeFactory();
  const ef = new EdgeFactory();
  const a = nf.create({ kind: NodeKind.Class, label: 'Foo', file: '/foo.ts' });
  const b = nf.create({ kind: NodeKind.Class, label: 'Bar', file: '/bar.ts' });
  graph.addNode(a);
  graph.addNode(b);
  graph.addEdge(ef.create({ source: a.id, target: b.id, kind: EdgeKind.IMPORTS }));
  return graph;
}

describe('Exporters', () => {
  it('exports DOT format', () => {
    const output = new DotExporter().export(sampleGraph());
    expect(output).toContain('digraph CodeGraph');
    expect(output).toContain('IMPORTS');
  });

  it('exports GraphML format', () => {
    const output = new GraphMLExporter().export(sampleGraph());
    expect(output).toContain('<graphml');
    expect(output).toContain('<node');
  });

  it('exports Cytoscape format', () => {
    const output = new CytoscapeExporter().export(sampleGraph());
    const parsed = JSON.parse(output) as { elements: unknown[] };
    expect(parsed.elements.length).toBe(4);
  });

  it('exports React Flow format', () => {
    const output = new ReactFlowExporter().export(sampleGraph());
    const parsed = JSON.parse(output) as { nodes: unknown[]; edges: unknown[] };
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
  });

  it('exports Neo4j CSV format', () => {
    const output = new Neo4jExporter().export(sampleGraph());
    expect(output).toContain(':START_ID');
    expect(output).toContain('IMPORTS');
  });

  it('exports Mermaid format', () => {
    const output = new MermaidExporter().export(sampleGraph());
    expect(output).toContain('graph LR');
  });
});
