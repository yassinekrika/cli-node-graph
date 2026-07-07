import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, ensureFileNode, registerSymbolNode } from './context.js';
import { NodeKind } from '../../model/NodeKind.js';
import { toPosixPath } from '../../utils/path.js';

/** Detects export declarations and re-exports. */
export class ExportVisitor implements ASTVisitor {
  readonly name = 'ExportVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isExportDeclaration(node)) {
      this.handleExportDeclaration(node, vctx);
    } else if (
      ts.canHaveModifiers(node) &&
      ts.getCombinedModifierFlags(node as ts.HasModifiers) & ts.ModifierFlags.Export
    ) {
      this.handleExportedDeclaration(node, vctx);
    }
  }

  private handleExportDeclaration(node: ts.ExportDeclaration, vctx: VisitorContext): void {
    const sourceFile = vctx.sourceFile;
    const filePath = toPosixPath(sourceFile.fileName);
    const fileId = ensureFileNode(this.ctx, filePath);

    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      const targetId = this.resolveModuleTarget(specifier, vctx);
      if (targetId) {
        addLocatedEdge(this.ctx, {
          source: fileId,
          target: targetId,
          kind: EdgeKind.EXPORTS,
          sourceFile,
          node,
          extra: { reExport: true, moduleSpecifier: specifier },
        });
      }
    }
  }

  private handleExportedDeclaration(node: ts.Node, vctx: VisitorContext): void {
    const sourceFile = vctx.sourceFile;
    const filePath = toPosixPath(sourceFile.fileName);
    const fileId = ensureFileNode(this.ctx, filePath);

    let name: string | undefined;
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          name = decl.name.text;
        }
      }
    } else if ('name' in node && node.name && ts.isIdentifier(node.name as ts.Identifier)) {
      name = (node.name as ts.Identifier).text;
    }

    if (name) {
      addLocatedEdge(this.ctx, {
        source: fileId,
        target: registerSymbolNode(this.ctx, {
          kind: this.inferKind(node),
          name,
          node,
          sourceFile,
          metadata: { exported: true },
        }),
        kind: EdgeKind.EXPORTS,
        sourceFile,
        node,
      });
    }
  }

  private inferKind(node: ts.Node): NodeKind {
    if (ts.isClassDeclaration(node)) return NodeKind.Class;
    if (ts.isInterfaceDeclaration(node)) return NodeKind.Interface;
    if (ts.isEnumDeclaration(node)) return NodeKind.Enum;
    if (ts.isFunctionDeclaration(node)) return NodeKind.Function;
    if (ts.isTypeAliasDeclaration(node)) return NodeKind.TypeAlias;
    return NodeKind.Variable;
  }

  private resolveModuleTarget(specifier: string, vctx: VisitorContext): string | undefined {
    const resolved = this.ctx.moduleResolver.resolveImport(
      specifier,
      vctx.sourceFile.fileName,
      vctx.program,
    );
    return resolved ? ensureFileNode(this.ctx, resolved) : undefined;
  }
}
