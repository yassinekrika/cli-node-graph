import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';

/** Captures type references in signatures and type annotations. */
export class TypeReferenceVisitor implements ASTVisitor {
  readonly name = 'TypeReferenceVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (ts.isTypeReferenceNode(node)) {
      this.handleTypeReference(node, vctx);
    }
  }

  private handleTypeReference(node: ts.TypeReferenceNode, vctx: VisitorContext): void {
    const type = vctx.checker.getTypeFromTypeNode(node);
    const symbol = type.getSymbol() ?? type.aliasSymbol;
    if (!symbol) return;

    const resolved = this.ctx.symbolResolver.resolveAlias(symbol);
    const decl = this.ctx.symbolResolver.getDeclaration(resolved);
    if (!decl) return;

    const typeName = this.ctx.symbolResolver.getSymbolName(resolved);
    const typeId = registerSymbolNode(this.ctx, {
      kind: this.inferTypeKind(resolved),
      name: typeName,
      node: decl,
      sourceFile: decl.getSourceFile(),
    });

    const enclosing = this.ctx.symbolResolver.getEnclosingSymbol(node);
    if (!enclosing) return;

    const enclosingDecl = this.ctx.symbolResolver.getDeclaration(enclosing);
    if (!enclosingDecl) return;

    const enclosingName = this.getEnclosingName(enclosingDecl);
    const enclosingId = registerSymbolNode(this.ctx, {
      kind: this.inferEnclosingKind(enclosingDecl),
      name: enclosingName,
      node: enclosingDecl,
      sourceFile: enclosingDecl.getSourceFile(),
    });

    addLocatedEdge(this.ctx, {
      source: enclosingId,
      target: typeId,
      kind: EdgeKind.TYPE_REFERENCE,
      sourceFile: vctx.sourceFile,
      node,
    });
  }

  private inferTypeKind(symbol: ts.Symbol): NodeKind {
    if (symbol.flags & ts.SymbolFlags.Interface) return NodeKind.Interface;
    if (symbol.flags & ts.SymbolFlags.Class) return NodeKind.Class;
    if (symbol.flags & ts.SymbolFlags.Enum) return NodeKind.Enum;
    return NodeKind.TypeAlias;
  }

  private inferEnclosingKind(decl: ts.Declaration): NodeKind {
    if (ts.isClassDeclaration(decl)) return NodeKind.Class;
    if (ts.isInterfaceDeclaration(decl)) return NodeKind.Interface;
    if (ts.isFunctionDeclaration(decl)) return NodeKind.Function;
    if (ts.isMethodDeclaration(decl)) return NodeKind.Method;
    return NodeKind.Variable;
  }

  private getEnclosingName(decl: ts.Declaration): string {
    if ('name' in decl && decl.name && ts.isIdentifier(decl.name as ts.Identifier)) {
      const name = (decl.name as ts.Identifier).text;
      if (ts.isMethodDeclaration(decl) && decl.parent && ts.isClassDeclaration(decl.parent) && decl.parent.name) {
        return `${decl.parent.name.text}.${name}`;
      }
      return name;
    }
    return 'anonymous';
  }
}
