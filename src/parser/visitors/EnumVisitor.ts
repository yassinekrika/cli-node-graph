import ts from 'typescript';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { registerSymbolNode } from './context.js';

/** Captures enum declarations. */
export class EnumVisitor implements ASTVisitor {
  readonly name = 'EnumVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isEnumDeclaration(node) && node.name) {
      registerSymbolNode(this.ctx, {
        kind: NodeKind.Enum,
        name: node.name.text,
        node,
        sourceFile: vctx.sourceFile,
        metadata: {
          memberCount: node.members.length,
          exported: ts.canHaveModifiers(node) && !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export),
        },
      });
    }
  }
}
