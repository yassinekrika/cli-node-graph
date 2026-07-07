import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';

/** Captures decorator usage on declarations. */
export class DecoratorVisitor implements ASTVisitor {
  readonly name = 'DecoratorVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (!ts.canHaveDecorators(node) || !ts.getDecorators(node)?.length) return;

    const targetId = this.resolveDecoratedNode(node, vctx);
    if (!targetId) return;

    for (const decorator of ts.getDecorators(node) ?? []) {
      const decoratorId = this.resolveDecorator(decorator, vctx);
      if (decoratorId) {
        addLocatedEdge(this.ctx, {
          source: targetId,
          target: decoratorId,
          kind: EdgeKind.DECORATED_BY,
          sourceFile: vctx.sourceFile,
          node: decorator,
        });
      }
    }
  }

  private resolveDecoratedNode(node: ts.Node, vctx: VisitorContext): string | undefined {
    if ('name' in node && node.name && ts.isIdentifier(node.name as ts.Identifier)) {
      const name = (node.name as ts.Identifier).text;
      const kind = ts.isClassDeclaration(node)
        ? NodeKind.Class
        : ts.isMethodDeclaration(node)
          ? NodeKind.Method
          : NodeKind.Function;
      return registerSymbolNode(this.ctx, { kind, name, node, sourceFile: vctx.sourceFile });
    }
    return undefined;
  }

  private resolveDecorator(decorator: ts.Decorator, vctx: VisitorContext): string | undefined {
    const expr = decorator.expression;
    let name: string | undefined;

    if (ts.isIdentifier(expr)) {
      name = expr.text;
    } else if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) {
      name = expr.expression.text;
    }

    if (!name) return undefined;

    const decoratorId = `Decorator:${name}`;
    if (!this.ctx.graph.getNode(decoratorId)) {
      this.ctx.graph.addNode(
        this.ctx.nodeFactory.create({
          kind: NodeKind.Decorator,
          label: name,
          idOverride: decoratorId,
        }),
      );
    }
    return decoratorId;
  }
}
