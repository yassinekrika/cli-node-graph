import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';

/** Captures function declarations including overloads. */
export class FunctionVisitor implements ASTVisitor {
  readonly name = 'FunctionVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isFunctionDeclaration(node) && node.name) {
      this.handleFunction(node, vctx);
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      this.handleFunctionExpression(node, vctx);
    }
  }

  private handleFunction(node: ts.FunctionDeclaration, vctx: VisitorContext): void {
    if (!node.name || !ts.isIdentifier(node.name)) return;

    const name = node.name.text;
    const fnId = registerSymbolNode(this.ctx, {
      kind: NodeKind.Function,
      name,
      node,
      sourceFile: vctx.sourceFile,
      metadata: {
        async: !!(node.modifiers && node.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)),
        generator: !!(node.asteriskToken),
        exported: ts.canHaveModifiers(node) && !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export),
      },
    });
    this.ctx.symbolNodeMap.set(`${vctx.sourceFile.fileName}:${name}`, fnId);

    if (node.type) {
      this.linkReturnType(fnId, node.type, vctx, node);
    }
  }

  private handleFunctionExpression(
    node: ts.ArrowFunction | ts.FunctionExpression,
    vctx: VisitorContext,
  ): void {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      registerSymbolNode(this.ctx, {
        kind: NodeKind.Function,
        name: parent.name.text,
        node,
        sourceFile: vctx.sourceFile,
        metadata: {
          async: !!(node.modifiers && node.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)),
        },
      });
    }
  }

  private linkReturnType(
    fnId: string,
    typeNode: ts.TypeNode,
    vctx: VisitorContext,
    node: ts.Node,
  ): void {
    const type = vctx.checker.getTypeFromTypeNode(typeNode);
    const typeName = vctx.checker.typeToString(type);
    const typeId = `Type:${typeName}`;
    if (!this.ctx.graph.getNode(typeId)) {
      this.ctx.graph.addNode(
        this.ctx.nodeFactory.create({
          kind: NodeKind.TypeAlias,
          label: typeName,
          idOverride: typeId,
        }),
      );
    }
    addLocatedEdge(this.ctx, {
      source: fnId,
      target: typeId,
      kind: EdgeKind.RETURNS,
      sourceFile: vctx.sourceFile,
      node,
    });
  }
}
