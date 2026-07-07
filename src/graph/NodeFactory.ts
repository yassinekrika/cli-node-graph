import type { SourceRange } from '../model/GraphNode.js';
import { NodeKind } from '../model/NodeKind.js';
import type { GraphNode, NodeMetadata } from '../model/GraphNode.js';
import { nodeId } from '../utils/id.js';

/** Factory for creating consistently structured graph nodes. */
export class NodeFactory {
  create(params: {
    kind: NodeKind;
    label: string;
    file?: string;
    line?: number;
    column?: number;
    range?: SourceRange;
    metadata?: NodeMetadata;
    idOverride?: string;
  }): GraphNode {
    const file = params.file ?? '';
    const id =
      params.idOverride ?? nodeId(params.kind, file, params.label, params.line);

    return {
      id,
      label: params.label,
      kind: params.kind,
      file: params.file,
      line: params.line,
      column: params.column,
      range: params.range,
      metadata: params.metadata ?? {},
    };
  }

  project(label: string, rootPath: string): GraphNode {
    return this.create({
      kind: NodeKind.Project,
      label,
      idOverride: `Project:${rootPath}`,
      metadata: { rootPath },
    });
  }

  folder(label: string, path: string): GraphNode {
    return this.create({
      kind: NodeKind.Folder,
      label,
      idOverride: `Folder:${path}`,
      metadata: { path },
    });
  }

  file(label: string, filePath: string): GraphNode {
    return this.create({
      kind: NodeKind.File,
      label,
      file: filePath,
      idOverride: `File:${filePath}`,
      metadata: { path: filePath },
    });
  }

  package(label: string, packageName: string): GraphNode {
    return this.create({
      kind: NodeKind.Package,
      label,
      idOverride: `Package:${packageName}`,
      metadata: { packageName },
    });
  }
}
