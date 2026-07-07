import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, ensureFileNode } from './context.js';
import { toPosixPath } from '../../utils/path.js';

/** Detects import declarations including dynamic imports. */
export class ImportVisitor implements ASTVisitor {
  readonly name = 'ImportVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isImportDeclaration(node)) {
      this.handleImportDeclaration(node, vctx);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      this.handleDynamicImport(node, vctx);
    }
  }

  private handleImportDeclaration(node: ts.ImportDeclaration, vctx: VisitorContext): void {
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;

    const specifier = node.moduleSpecifier.text;
    const sourceFile = vctx.sourceFile;
    const filePath = toPosixPath(sourceFile.fileName);
    const sourceFileId = ensureFileNode(this.ctx, filePath);

    const targetId = this.resolveTarget(specifier, vctx, node);
    if (!targetId) return;

    const isTypeOnly = node.importClause?.isTypeOnly ?? false;
    addLocatedEdge(this.ctx, {
      source: sourceFileId,
      target: targetId,
      kind: EdgeKind.IMPORTS,
      sourceFile,
      node,
      extra: { moduleSpecifier: specifier, typeOnly: isTypeOnly },
    });

    addLocatedEdge(this.ctx, {
      source: sourceFileId,
      target: targetId,
      kind: EdgeKind.DEPENDS_ON,
      sourceFile,
      node,
      extra: { moduleSpecifier: specifier },
    });
  }

  private handleDynamicImport(node: ts.CallExpression, vctx: VisitorContext): void {
    const arg = node.arguments[0];
    if (!arg || !ts.isStringLiteral(arg)) return;

    const specifier = arg.text;
    const sourceFile = vctx.sourceFile;
    const filePath = toPosixPath(sourceFile.fileName);
    const sourceFileId = ensureFileNode(this.ctx, filePath);
    const targetId = this.resolveTarget(specifier, vctx, node);
    if (!targetId) return;

    addLocatedEdge(this.ctx, {
      source: sourceFileId,
      target: targetId,
      kind: EdgeKind.DYNAMIC_IMPORT,
      sourceFile,
      node,
      static: false,
      confidence: 'medium',
      extra: { moduleSpecifier: specifier },
    });
  }

  private resolveTarget(
    specifier: string,
    vctx: VisitorContext,
    node: ts.Node,
  ): string | undefined {
    if (this.ctx.moduleResolver.isPackageImport(specifier)) {
      const packageName = this.ctx.moduleResolver.getPackageName(specifier);
      const packageId = `Package:${packageName}`;
      if (!this.ctx.graph.getNode(packageId)) {
        const packageNode = this.ctx.nodeFactory.package(packageName, packageName);
        this.ctx.graph.addNode(packageNode);
      }
      return packageId;
    }

    const resolved = this.ctx.moduleResolver.resolveImport(
      specifier,
      vctx.sourceFile.fileName,
      vctx.program,
    );
    if (resolved) {
      return ensureFileNode(this.ctx, resolved);
    }

    const moduleId = `Module:${specifier}`;
    if (!this.ctx.graph.getNode(moduleId)) {
      this.ctx.graph.addNode(
        this.ctx.nodeFactory.create({
          kind: NodeKind.Module,
          label: specifier,
          idOverride: moduleId,
        }),
      );
    }
    return moduleId;
  }
}
