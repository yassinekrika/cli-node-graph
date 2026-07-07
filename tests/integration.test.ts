import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GraphBuilder } from '../src/graph/GraphBuilder.js';
import { NodeKind } from '../src/model/NodeKind.js';
import { EdgeKind } from '../src/model/EdgeKind.js';
import { JsonExporter } from '../src/exporters/JsonExporter.js';
import { CircularDependencyAnalyzer } from '../src/analysis/CircularDependencyAnalyzer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, 'fixtures', 'sample-project');

describe('GraphBuilder integration', () => {
  it('analyzes sample project and produces nodes and edges', () => {
    const builder = new GraphBuilder();
    const graph = builder.build({ projectRoot: FIXTURE_ROOT });

    expect(graph.nodeCount).toBeGreaterThan(0);
    expect(graph.edgeCount).toBeGreaterThan(0);

    const classes = graph.getNodesByKind(NodeKind.Class);
    expect(classes.some((c) => c.label === 'UserService')).toBe(true);
    expect(classes.some((c) => c.label === 'UserController')).toBe(true);

    const interfaces = graph.getNodesByKind(NodeKind.Interface);
    expect(interfaces.some((i) => i.label === 'UserRepository')).toBe(true);

    const imports = graph.getEdgesByKind(EdgeKind.IMPORTS);
    expect(imports.length).toBeGreaterThan(0);
  });

  it('detects IMPLEMENTS relationship', () => {
    const builder = new GraphBuilder();
    const graph = builder.build({ projectRoot: FIXTURE_ROOT });
    const implementsEdges = graph.getEdgesByKind(EdgeKind.IMPLEMENTS);
    expect(implementsEdges.length).toBeGreaterThan(0);
  });

  it('exports to JSON', () => {
    const builder = new GraphBuilder();
    const graph = builder.build({ projectRoot: FIXTURE_ROOT });
    const exporter = new JsonExporter();
    const json = exporter.export(graph);
    const parsed = JSON.parse(json) as { nodes: unknown[]; edges: unknown[] };
    expect(parsed.nodes.length).toBe(graph.nodeCount);
    expect(parsed.edges.length).toBe(graph.edgeCount);
  });

  it('runs circular dependency analysis', () => {
    const builder = new GraphBuilder();
    const graph = builder.build({ projectRoot: FIXTURE_ROOT });
    const analyzer = new CircularDependencyAnalyzer();
    const cycles = analyzer.analyze(graph);
    expect(Array.isArray(cycles)).toBe(true);
  });
});
