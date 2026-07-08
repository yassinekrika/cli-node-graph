# API Reference

`cli-node-graph` provides a rich programmatic API for parsing, analyzing, and exporting TypeScript codebases.

## Core Classes

### `GraphBuilder`

Builds a dependency graph from a given TypeScript project.

```typescript
import { GraphBuilder } from 'cli-node-graph';

const builder = new GraphBuilder();
const graph = builder.build({ projectRoot: './my-project' });
```

### `Graph`

Represents the knowledge graph containing nodes and edges.

```typescript
import { Graph } from 'cli-node-graph';

const nodes = graph.getNodes();
const edges = graph.getEdges();

const myNode = graph.getNodeById('src/index.ts:MyClass');
const dependencies = graph.getOutgoingEdges(myNode.id);
```

### `NodeKind` & `EdgeKind`

Enums representing the different types of nodes and relationships in the graph.

```typescript
import { NodeKind, EdgeKind } from 'cli-node-graph';

// Node types: File, Class, Interface, Function, Method, etc.
console.log(NodeKind.Class);

// Edge types: Imports, Calls, Extends, Implements, etc.
console.log(EdgeKind.Imports);
```

## Analyzers

`cli-node-graph` includes several built-in analyzers for gaining insights into your codebase.

### `GraphAlgorithms`

Provides foundational graph algorithms.

```typescript
import { GraphAlgorithms } from 'cli-node-graph';

const algo = new GraphAlgorithms(graph);
const cycles = algo.detectCycles();
```

### `CircularDependencyAnalyzer`

Analyzes and reports circular dependencies (cycles).

```typescript
import { CircularDependencyAnalyzer } from 'cli-node-graph';

const analyzer = new CircularDependencyAnalyzer(graph);
const report = analyzer.analyze();
console.log(report.cycles);
```

### `ImpactAnalyzer`

Calculates the impact of changing a specific symbol or file.

```typescript
import { ImpactAnalyzer } from 'cli-node-graph';

const analyzer = new ImpactAnalyzer(graph);
const report = analyzer.analyze('src/core/UserService.ts:UserService');
console.log(report.affectedNodes);
```

### Other Analyzers
- `DeadCodeAnalyzer`: Finds unused code.
- `DependencyAnalyzer`: Analyzes dependencies and coupling.
- `LayerViolationAnalyzer`: Enforces architectural boundaries.

## Exporters

Export your graph to various formats for visualization or further processing.

```typescript
import { 
  JsonExporter, 
  DotExporter, 
  MermaidExporter, 
  GraphMLExporter, 
  CytoscapeExporter, 
  ReactFlowExporter, 
  Neo4jExporter 
} from 'cli-node-graph';

// JSON (Raw Data)
const jsonStr = new JsonExporter().export(graph);

// React Flow (Interactive UI)
const reactFlowData = new ReactFlowExporter().export(graph);

// Mermaid (Markdown Docs)
const mermaidStr = new MermaidExporter().export(graph);
```
