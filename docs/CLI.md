# CLI Reference

## Commands

### `cli-node-graph view [path]`

Analyze a TypeScript project and open an interactive graph visualization in the browser.
Starts a local HTTP server serving the pre-built visualization app with your project's graph data.

```bash
cli-node-graph view .
cli-node-graph view ./apps/api --tsconfig tsconfig.app.json
cli-node-graph view . --port 3000
cli-node-graph view . --no-open   # print URL only, don't auto-open browser
```

| Option | Default | Description |
|--------|---------|-------------|
| `--tsconfig <path>` | `tsconfig.json` | Path to tsconfig.json |
| `--port <number>` | `5173` | Local server port |
| `--no-open` | — | Disable auto-opening the browser |

### `cli-node-graph analyze [path]`

Analyze a TypeScript project and build the dependency graph.

```bash
cli-node-graph analyze .
cli-node-graph analyze ./apps/api --tsconfig tsconfig.app.json
```

### `cli-node-graph graph [path]`

Show summary statistics of the cached or last-analyzed graph.

### `cli-node-graph export [path] --format <format>`

Export the graph to a file format.

| Format | Description |
|--------|-------------|
| `json` | Full graph as JSON |
| `dot` | Graphviz DOT |
| `graphml` | GraphML XML |
| `mermaid` | Mermaid diagram |
| `cytoscape` | Cytoscape.js elements |
| `reactflow` | React Flow nodes/edges |
| `neo4j` | Neo4j CSV import |

```bash
cli-node-graph export . --format json -o graph.json
cli-node-graph export . --format dot -o graph.dot
cli-node-graph export . --format reactflow -o graph.json
```

### `cli-node-graph cycles [path]`

Detect and list all circular dependencies.

### `cli-node-graph impact <target> [path]`

Analyze downstream impact of modifying a file or symbol.

```bash
cli-node-graph impact src/UserService.ts
cli-node-graph impact UserController
```

### `cli-node-graph stats [path]`

Show detailed graph statistics (node/edge counts by kind).

## Cache

Analysis results are cached in `.cli-node-graph/graph.json` in the project root.

## Exit Codes

- `0` — Success
- `1` — Error (missing graph, unknown format, node not found)
