import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';

/** Captures extends/implements heritage clauses. */
export class HeritageVisitor implements ASTVisitor {
  readonly name = 'HeritageVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isClassDeclaration(node) && node.name) {
      this.handleClassHeritage(node, vctx);
    } else if (ts.isInterfaceDeclaration(node) && node.name) {
      this.handleInterfaceHeritage(node, vctx);
    }
  }

  private handleClassHeritage(node: ts.ClassDeclaration, vctx: VisitorContext): void {
    const classId = registerSymbolNode(this.ctx, {
      kind: NodeKind.Class,
      name: node.name!.text,
      node,
      sourceFile: vctx.sourceFile,
    });

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        const kind =
          clause.token === ts.SyntaxKind.ExtendsKeyword ? EdgeKind.EXTENDS : EdgeKind.IMPLEMENTS;
        for (const type of clause.types) {
          const targetId = this.resolveHeritageType(type, vctx);
          if (targetId) {
            addLocatedEdge(this.ctx, {
              source: classId,
              target: targetId,
              kind,
              sourceFile: vctx.sourceFile,
              node: type,
            });
          }
        }
      }
    }
  }

  private handleInterfaceHeritage(node: ts.InterfaceDeclaration, vctx: VisitorContext): void {
    const interfaceId = registerSymbolNode(this.ctx, {
      kind: NodeKind.Interface,
      name: node.name.text,
      node,
      sourceFile: vctx.sourceFile,
    });

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        for (const type of clause.types) {
          const targetId = this.resolveHeritageType(type, vctx);
          if (targetId) {
            addLocatedEdge(this.ctx, {
              source: interfaceId,
              target: targetId,
              kind: EdgeKind.EXTENDS,
              sourceFile: vctx.sourceFile,
              node: type,
            });
          }
        }
      }
    }
  }

  private resolveHeritageType(
    type: ts.ExpressionWithTypeArguments,
    _vctx: VisitorContext,
  ): string | undefined {
    const symbol = this.ctx.symbolResolver.getSymbolAtLocation(type.expression);
    if (!symbol) return undefined;

    const resolved = this.ctx.symbolResolver.resolveAlias(symbol);
    const decl = this.ctx.symbolResolver.getDeclaration(resolved);
    if (!decl) return undefined;

    const name = this.ctx.symbolResolver.getSymbolName(resolved);
    const kind =
      symbol.flags & ts.SymbolFlags.Interface ? NodeKind.Interface : NodeKind.Class;

    return registerSymbolNode(this.ctx, {
      kind,
      name,
      node: decl,
      sourceFile: decl.getSourceFile(),
    });
  }
}
