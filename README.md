# cli-node-graph

TypeScript codebase knowledge graph analyzer — an Nx-style dependency graph tool with deep symbol-level analysis.

[![npm version](https://img.shields.io/npm/v/cli-node-graph.svg)](https://npmjs.org/package/cli-node-graph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Deep AST Analysis:** Parses TypeScript files to extract classes, interfaces, functions, methods, and decorators.
- **Rich Relationships:** Tracks imports, function calls, class inheritance, and structural dependencies.
- **Advanced Graph Algorithms:** Includes cycle detection, shortest path, impact analysis, and topological sorting.
- **Multiple Export Formats:** Export to JSON, DOT (Graphviz), GraphML, Mermaid, Cytoscape, React Flow, and Neo4j CSV.
- **Visualization Tools:** Use the built-in React Flow visualizer for interactive graph exploration.

## Installation

Install globally to use the CLI from anywhere:

```bash
npm install -g cli-node-graph
# or
pnpm add -g cli-node-graph
# or
yarn global add cli-node-graph
```

Or run it directly using `npx`:

```bash
npx cli-node-graph <command> [options]
```

## Usage

### Analyzing a Project

Analyze a TypeScript codebase to build the knowledge graph:

```bash
cli-node-graph analyze ./path/to/project
```

### Exporting the Graph

Export the knowledge graph to various formats (e.g., `reactflow`, `json`, `dot`, `mermaid`):

```bash
cli-node-graph export ./path/to/project --format reactflow -o graph.json
```

### Finding Cycles

Detect circular dependencies in your project:

```bash
cli-node-graph cycles ./path/to/project
```

### Impact Analysis

Determine what files or symbols are affected if you change a specific symbol:

```bash
cli-node-graph impact UserService ./path/to/project
```

### Project Statistics

View overall statistics of your codebase:

```bash
cli-node-graph stats ./path/to/project
```

## API Usage

You can also use `cli-node-graph` programmatically in your Node.js scripts:

```bash
npm install cli-node-graph
```

```typescript
import { GraphBuilder, GraphAlgorithms, JsonExporter } from 'cli-node-graph';

// Build the graph
const graph = new GraphBuilder().build({ projectRoot: './my-project' });

// Analyze the graph
const cycles = new GraphAlgorithms(graph).detectCycles();
console.log('Cycles found:', cycles);

// Export the graph
const json = new JsonExporter().export(graph);
```

## Contributing

If you're interested in contributing to the project, please see our [Contributing Guide](CONTRIBUTING.md) for details on setting up the development environment, architecture, and running tests.

## License

[MIT](LICENSE)
