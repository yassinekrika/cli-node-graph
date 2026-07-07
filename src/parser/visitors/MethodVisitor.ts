import ts from 'typescript';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { registerSymbolNode } from './context.js';

/** Captures method declarations on classes and object literals. */
export class MethodVisitor implements ASTVisitor {
  readonly name = 'MethodVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isMethodDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      const parent = node.parent;
      let prefix = '';
      if (ts.isClassDeclaration(parent) && parent.name) {
        prefix = `${parent.name.text}.`;
      }
      registerSymbolNode(this.ctx, {
        kind: NodeKind.Method,
        name: `${prefix}${node.name.text}`,
        node,
        sourceFile: vctx.sourceFile,
        metadata: {
          async: !!(node.modifiers && node.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)),
        },
      });
    }
  }
}
