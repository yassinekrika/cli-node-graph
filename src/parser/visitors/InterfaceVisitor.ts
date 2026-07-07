import ts from 'typescript';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { registerSymbolNode } from './context.js';

/** Captures interface declarations and generic constraints. */
export class InterfaceVisitor implements ASTVisitor {
  readonly name = 'InterfaceVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isInterfaceDeclaration(node) && node.name) {
      const typeParams = node.typeParameters?.map((tp) => tp.name.text) ?? [];
      const id = registerSymbolNode(this.ctx, {
        kind: NodeKind.Interface,
        name: node.name.text,
        node,
        sourceFile: vctx.sourceFile,
        metadata: {
          typeParameters: typeParams,
          exported: ts.canHaveModifiers(node) && !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export),
        },
      });
      this.ctx.symbolNodeMap.set(`${vctx.sourceFile.fileName}:${node.name.text}`, id);
    }
  }
}
