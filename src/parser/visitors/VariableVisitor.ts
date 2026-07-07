import ts from 'typescript';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { registerSymbolNode } from './context.js';

/** Captures variable declarations. */
export class VariableVisitor implements ASTVisitor {
  readonly name = 'VariableVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const parent = node.parent?.parent;
      const isExported =
        parent &&
        ts.canHaveModifiers(parent) &&
        !!(ts.getCombinedModifierFlags(parent) & ts.ModifierFlags.Export);

      registerSymbolNode(this.ctx, {
        kind: NodeKind.Variable,
        name: node.name.text,
        node,
        sourceFile: vctx.sourceFile,
        metadata: { exported: isExported ?? false },
      });
    }
  }
}
