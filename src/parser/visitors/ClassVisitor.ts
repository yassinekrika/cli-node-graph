import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';

/** Captures class declarations, members, and heritage. */
export class ClassVisitor implements ASTVisitor {
  readonly name = 'ClassVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isClassDeclaration(node) && node.name) {
      this.handleClass(node, vctx);
    } else if (ts.isConstructorDeclaration(node)) {
      this.handleConstructor(node, vctx);
    } else if (ts.isPropertyDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
      this.handleProperty(node, vctx);
    }
  }

  private handleClass(node: ts.ClassDeclaration, vctx: VisitorContext): void {
    const name = node.name!.text;
    const classId = registerSymbolNode(this.ctx, {
      kind: NodeKind.Class,
      name,
      node,
      sourceFile: vctx.sourceFile,
      metadata: {
        abstract: ts.canHaveModifiers(node) && !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Abstract),
        exported: ts.canHaveModifiers(node) && !!(ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export),
      },
    });

    this.ctx.symbolNodeMap.set(`${vctx.sourceFile.fileName}:${name}`, classId);

    for (const member of node.members) {
      if (ts.isMethodDeclaration(member) && member.name && ts.isIdentifier(member.name)) {
        const methodId = registerSymbolNode(this.ctx, {
          kind: NodeKind.Method,
          name: `${name}.${member.name.text}`,
          node: member,
          sourceFile: vctx.sourceFile,
          metadata: {
            className: name,
            async: !!(member.modifiers && member.modifiers.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword)),
          },
        });
        addLocatedEdge(this.ctx, {
          source: classId,
          target: methodId,
          kind: EdgeKind.CONTAINS,
          sourceFile: vctx.sourceFile,
          node: member,
        });
      }
    }
  }

  private handleConstructor(node: ts.ConstructorDeclaration, vctx: VisitorContext): void {
    const classNode = node.parent;
    if (!ts.isClassDeclaration(classNode) || !classNode.name) return;

    const name = classNode.name.text;
    registerSymbolNode(this.ctx, {
      kind: NodeKind.Constructor,
      name: `${name}.constructor`,
      node,
      sourceFile: vctx.sourceFile,
      metadata: { className: name },
    });
  }

  private handleProperty(node: ts.PropertyDeclaration, vctx: VisitorContext): void {
    const classNode = node.parent;
    if (!ts.isClassDeclaration(classNode) || !classNode.name) return;

    const className = classNode.name.text;
    registerSymbolNode(this.ctx, {
      kind: NodeKind.Property,
      name: `${className}.${node.name.text}`,
      node,
      sourceFile: vctx.sourceFile,
      metadata: { className },
    });
  }
}
