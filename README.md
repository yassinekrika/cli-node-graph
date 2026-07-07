# cli-node-graph

TypeScript codebase knowledge graph analyzer — an Nx-style dependency graph tool with deep symbol-level analysis.

## Features

- **Full AST analysis** using the TypeScript Compiler API
- **Rich graph model** — files, classes, interfaces, functions, methods, imports, calls, inheritance, decorators, and more
- **Graph algorithms** — cycle detection, shortest path, impact analysis, topological sort
- **Multiple export formats** — JSON, DOT, GraphML, Mermaid, Cytoscape, React Flow, Neo4j CSV
- **CLI** for analysis, export, and querying
- **React Flow visualization** with search, filtering, path finder, and layouts

## Quick Start

```bash
npm install
npm run build
npm test

# Analyze a project
<<<<<<< HEAD
pnpm run codegraph analyze ./tests/fixtures/sample-project

# Export graph
pnpm run codegraph export ./tests/fixtures/sample-project --format reactflow -o graph.json

# Detect cycles
pnpm run codegraph cycles ./tests/fixtures/sample-project

# Impact analysis
pnpm run codegraph impact UserService ./tests/fixtures/sample-project

# Statistics
pnpm run codegraph stats ./tests/fixtures/sample-project
=======
npm run cli-node-graph analyze ./tests/fixtures/sample-project

# Export graph
npm run cli-node-graph export ./tests/fixtures/sample-project --format reactflow -o graph.json

# Detect cycles
npm run cli-node-graph cycles ./tests/fixtures/sample-project

# Impact analysis
npm run cli-node-graph impact UserService ./tests/fixtures/sample-project

# Statistics
npm run cli-node-graph stats ./tests/fixtures/sample-project
>>>>>>> 6d097b2 (switch to pnpm + build fix)
```

## Visualization

```bash
cd visualization
pnpm install
pnpm run dev
```

Load a React Flow JSON export from the CLI to visualize your codebase graph interactively.

## Architecture

```
CLI → Project Loader → TypeScript Program → AST Walker → Visitors → Resolvers → Graph Builder → Graph → Exporters / Analyzers
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## API

```typescript
import { GraphBuilder, GraphAlgorithms, JsonExporter } from 'cli-node-graph';

const graph = new GraphBuilder().build({ projectRoot: './my-project' });
const cycles = new GraphAlgorithms(graph).detectCycles();
const json = new JsonExporter().export(graph);
```

See [docs/API.md](docs/API.md) for the full API reference.

## License

MIT
