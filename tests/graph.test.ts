import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { Graph } from '../src/graph/Graph.js';
import { GraphAlgorithms } from '../src/graph/GraphAlgorithms.js';
import { NodeFactory } from '../src/graph/NodeFactory.js';
import { EdgeFactory } from '../src/graph/EdgeFactory.js';
import { EdgeKind } from '../src/model/EdgeKind.js';
import { NodeKind } from '../src/model/NodeKind.js';

describe('Graph', () => {
  it('adds nodes and edges with indexing', () => {
    const graph = new Graph();
    const nodeFactory = new NodeFactory();
    const edgeFactory = new EdgeFactory();

    const a = nodeFactory.create({ kind: NodeKind.Class, label: 'A', file: '/a.ts' });
    const b = nodeFactory.create({ kind: NodeKind.Class, label: 'B', file: '/b.ts' });
    graph.addNode(a);
    graph.addNode(b);
    graph.addEdge(edgeFactory.create({ source: a.id, target: b.id, kind: EdgeKind.IMPORTS }));

    expect(graph.nodeCount).toBe(2);
    expect(graph.edgeCount).toBe(1);
    expect(graph.getNodesByKind(NodeKind.Class)).toHaveLength(2);
    expect(graph.getOutgoingEdges(a.id)).toHaveLength(1);
    expect(graph.getIncomingEdges(b.id)).toHaveLength(1);
  });

  it('filters graph to subset of nodes', () => {
    const graph = new Graph();
    const nodeFactory = new NodeFactory();
    const a = nodeFactory.create({ kind: NodeKind.File, label: 'a.ts', file: '/a.ts' });
    const b = nodeFactory.create({ kind: NodeKind.File, label: 'b.ts', file: '/b.ts' });
    graph.addNode(a);
    graph.addNode(b);

    const filtered = graph.filter(new Set([a.id]));
    expect(filtered.nodeCount).toBe(1);
  });
});

describe('GraphAlgorithms', () => {
  it('finds shortest path', () => {
    const graph = new Graph();
    const nodeFactory = new NodeFactory();
    const edgeFactory = new EdgeFactory();

    const nodes = ['a', 'b', 'c'].map((id) =>
      nodeFactory.create({ kind: NodeKind.File, label: id, idOverride: id }),
    );
    nodes.forEach((n) => graph.addNode(n));
    graph.addEdge(edgeFactory.create({ source: 'a', target: 'b', kind: EdgeKind.DEPENDS_ON }));
    graph.addEdge(edgeFactory.create({ source: 'b', target: 'c', kind: EdgeKind.DEPENDS_ON }));

    const algorithms = new GraphAlgorithms(graph);
    const path = algorithms.shortestPath('a', 'c');
    expect(path).toEqual(['a', 'b', 'c']);
  });

  it('detects cycles', () => {
    const graph = new Graph();
    const nodeFactory = new NodeFactory();
    const edgeFactory = new EdgeFactory();

    for (const id of ['a', 'b', 'c']) {
      graph.addNode(nodeFactory.create({ kind: NodeKind.File, label: id, idOverride: id }));
    }
    graph.addEdge(edgeFactory.create({ source: 'a', target: 'b', kind: EdgeKind.DEPENDS_ON }));
    graph.addEdge(edgeFactory.create({ source: 'b', target: 'c', kind: EdgeKind.DEPENDS_ON }));
    graph.addEdge(edgeFactory.create({ source: 'c', target: 'a', kind: EdgeKind.DEPENDS_ON }));

    const algorithms = new GraphAlgorithms(graph);
    const cycles = algorithms.detectCycles();
    expect(cycles.length).toBeGreaterThan(0);
  });
});
