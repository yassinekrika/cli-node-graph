# CLI Reference

## Commands

### `codegraph analyze [path]`

Analyze a TypeScript project and build the dependency graph.

```bash
codegraph analyze .
codegraph analyze ./apps/api --tsconfig tsconfig.app.json
```

### `codegraph graph [path]`

Show summary statistics of the cached or last-analyzed graph.

### `codegraph export [path] --format <format>`

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
codegraph export . --format json -o graph.json
codegraph export . --format dot -o graph.dot
codegraph export . --format reactflow -o graph.json
```

### `codegraph cycles [path]`

Detect and list all circular dependencies.

### `codegraph impact <target> [path]`

Analyze downstream impact of modifying a file or symbol.

```bash
codegraph impact src/UserService.ts
codegraph impact UserController
```

### `codegraph stats [path]`

Show detailed graph statistics (node/edge counts by kind).

## Cache

Analysis results are cached in `.codegraph/graph.json` in the project root.

## Exit Codes

- `0` — Success
- `1` — Error (missing graph, unknown format, node not found)
