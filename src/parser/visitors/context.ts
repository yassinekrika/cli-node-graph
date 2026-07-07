import type { GraphEdge } from '../../model/GraphEdge.js';
import type { GraphNode, SourceRange } from '../../model/GraphNode.js';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { EdgeFactory } from '../../graph/EdgeFactory.js';
import type { NodeFactory } from '../../graph/NodeFactory.js';
import type { Graph } from '../../graph/Graph.js';
import type { ModuleResolver } from '../../resolver/ModuleResolver.js';
import type { PathResolver } from '../../resolver/PathResolver.js';
import type { SymbolResolver } from '../../resolver/SymbolResolver.js';
import type { TypeResolver } from '../../resolver/TypeResolver.js';
import { toPosixPath } from '../../utils/path.js';
import ts from 'typescript';

/** Shared context for graph-building visitors. */
export interface GraphBuildContext {
  graph: Graph;
  nodeFactory: NodeFactory;
  edgeFactory: EdgeFactory;
  symbolResolver: SymbolResolver;
  typeResolver: TypeResolver;
  moduleResolver: ModuleResolver;
  pathResolver: PathResolver;
  projectRoot: string;
  symbolNodeMap: Map<string, string>;
  fileNodeMap: Map<string, string>;
}

/** Get source range from a node. */
export function getSourceRange(node: ts.Node, sourceFile: ts.SourceFile): SourceRange {
  const { line: startLine, character: startColumn } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );
  const { line: endLine, character: endColumn } = sourceFile.getLineAndCharacterOfPosition(
    node.getEnd(),
  );
  return {
    startLine: startLine + 1,
    startColumn: startColumn + 1,
    endLine: endLine + 1,
    endColumn: endColumn + 1,
  };
}

/** Get line/column for a node. */
export function getLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): { line: number; column: number } {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: line + 1, column: character + 1 };
}

/** Ensure structural nodes (project, folders, files) exist. */
export function ensureFileNode(ctx: GraphBuildContext, filePath: string): string {
  const normalized = toPosixPath(filePath);
  const existing = ctx.fileNodeMap.get(normalized);
  if (existing) return existing;

  const fileName = normalized.split('/').pop() ?? normalized;
  const fileNode = ctx.nodeFactory.file(fileName, normalized);
  ctx.graph.addNode(fileNode);
  ctx.fileNodeMap.set(normalized, fileNode.id);

  ensureFolderHierarchy(ctx, normalized);
  return fileNode.id;
}

function ensureFolderHierarchy(ctx: GraphBuildContext, filePath: string): void {
  const parts = filePath.split('/');
  parts.pop();
  let currentPath = '';
  let parentId: string | undefined;

  const projectNodes = ctx.graph.getNodesByKind(NodeKind.Project);
  parentId = projectNodes[0]?.id;

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const folderId = `Folder:${currentPath}`;
    if (!ctx.graph.getNode(folderId)) {
      const folderNode = ctx.nodeFactory.folder(part, currentPath);
      ctx.graph.addNode(folderNode);
      if (parentId) {
        ctx.graph.addEdge(
          ctx.edgeFactory.create({
            source: folderNode.id,
            target: parentId,
            kind: EdgeKind.BELONGS_TO,
          }),
        );
      }
    }
    parentId = folderId;
  }

  const fileNodeId = ctx.fileNodeMap.get(filePath);
  if (fileNodeId && parentId) {
    ctx.graph.addEdge(
      ctx.edgeFactory.create({
        source: fileNodeId,
        target: parentId,
        kind: EdgeKind.BELONGS_TO,
      }),
    );
  }
}

/** Register a symbol node and return its id. */
export function registerSymbolNode(
  ctx: GraphBuildContext,
  params: {
    kind: NodeKind;
    name: string;
    node: ts.Node;
    sourceFile: ts.SourceFile;
    metadata?: Record<string, string | number | boolean | string[] | undefined>;
  },
): string {
  const filePath = toPosixPath(params.sourceFile.fileName);
  ensureFileNode(ctx, filePath);
  const loc = getLocation(params.node, params.sourceFile);
  const range = getSourceRange(params.node, params.sourceFile);

  const graphNode = ctx.nodeFactory.create({
    kind: params.kind,
    label: params.name,
    file: filePath,
    line: loc.line,
    column: loc.column,
    range,
    metadata: params.metadata,
  });

  ctx.graph.addNode(graphNode);

  const fileNodeId = ctx.fileNodeMap.get(filePath);
  if (fileNodeId) {
    ctx.graph.addEdge(
      ctx.edgeFactory.create({
        source: graphNode.id,
        target: fileNodeId,
        kind: EdgeKind.CONTAINS,
        metadata: {
          file: filePath,
          line: loc.line,
          column: loc.column,
          confidence: 'high',
          static: true,
        },
      }),
    );
  }

  return graphNode.id;
}

/** Add an edge with standard location metadata. */
export function addLocatedEdge(
  ctx: GraphBuildContext,
  params: {
    source: string;
    target: string;
    kind: EdgeKind;
    sourceFile: ts.SourceFile;
    node: ts.Node;
    confidence?: 'high' | 'medium' | 'low';
    static?: boolean;
    extra?: Record<string, string | number | boolean | string[] | undefined>;
  },
): GraphEdge {
  const loc = getLocation(params.node, params.sourceFile);
  const edge = ctx.edgeFactory.create({
    source: params.source,
    target: params.target,
    kind: params.kind,
    metadata: {
      file: toPosixPath(params.sourceFile.fileName),
      line: loc.line,
      column: loc.column,
      confidence: params.confidence ?? 'high',
      static: params.static ?? true,
      ...params.extra,
    },
  });
  ctx.graph.addEdge(edge);
  return edge;
}
