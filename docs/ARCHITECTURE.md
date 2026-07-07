# Architecture

## Overview

CodeGraph uses a layered architecture where each layer is independent and testable.

```
CLI
  │
  ▼
Project Loader
  │
  ▼
TypeScript Program (ProgramFactory)
  │
  ▼
AST Walker (single traversal)
  │
  ▼
Visitors (Import, Export, Class, Call, …)
  │
  ▼
Resolvers (Symbol, Type, Module, Path)
  │
  ▼
Graph Builder
  │
  ▼
Graph Database
  │
  ├── Exporters (JSON, DOT, GraphML, …)
  ├── Analyzers (Cycles, Impact, Dead Code, Layers)
  └── Visualization (React Flow)
```

## Layers

### Parser Layer

- **ProgramFactory** — Reads `tsconfig.json`, creates `Program`, `TypeChecker`, and filtered source files
- **ASTWalker** — Single-pass traversal dispatching to all visitors (avoids repeated AST walks)

### Visitor Layer

One visitor per concern:

| Visitor | Responsibility |
|---------|---------------|
| ImportVisitor | Static and dynamic imports |
| ExportVisitor | Exports and re-exports |
| ClassVisitor | Classes, methods, properties, constructors |
| InterfaceVisitor | Interface declarations |
| EnumVisitor | Enum declarations |
| FunctionVisitor | Functions, arrow functions, return types |
| MethodVisitor | Method declarations |
| VariableVisitor | Variable declarations |
| CallVisitor | Call expressions resolved via TypeChecker |
| DecoratorVisitor | Decorator usage |
| TypeReferenceVisitor | Type references in signatures |
| HeritageVisitor | extends / implements clauses |

### Resolver Layer

- **SymbolResolver** — `getSymbolAtLocation`, alias resolution, cached lookups
- **TypeResolver** — `getTypeAtLocation`, call signatures, return types
- **ModuleResolver** — Module specifier → file path resolution
- **PathResolver** — Project-relative path normalization

### Graph Layer

- **Graph** — Indexed in-memory graph (by kind, file, adjacency)
- **GraphBuilder** — Orchestrates the full pipeline
- **GraphAlgorithms** — Topological sort, SCCs, shortest path, impact traversal

### Analysis Layer

- **CircularDependencyAnalyzer** — Finds all dependency cycles
- **DeadCodeAnalyzer** — Unused exports, functions, orphan modules
- **ImpactAnalyzer** — Downstream impact of changes
- **DependencyAnalyzer** — Coupling metrics
- **LayerViolationAnalyzer** — Architecture layer rule enforcement

## Design Decisions

1. **Single AST traversal** — All visitors run in one walk to support large codebases (100k+ nodes)
2. **TypeChecker-first resolution** — No string matching; all symbol resolution goes through the TS API
3. **Cached symbol lookups** — LRU cache prevents repeated TypeChecker calls
4. **Indexed graph** — O(1) lookups by kind, file, and adjacency for fast queries
5. **Independent exporters** — Each format is a standalone class implementing `GraphExporter`

## Performance Considerations

- Indexed adjacency lists for graph queries
- Symbol lookup cache (10k entries default)
- Filtered source files (no `.d.ts`, configurable excludes)
- Graph filtering and cloning for subset analysis

## Extensibility

Add new node/edge kinds in `model/`, create a new visitor in `parser/visitors/`, register it in `GraphBuilder`. Add new exporters by implementing `GraphExporter`.
