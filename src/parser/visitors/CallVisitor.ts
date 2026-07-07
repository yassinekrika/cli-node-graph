import ts from 'typescript';
import { EdgeKind } from '../../model/EdgeKind.js';
import { NodeKind } from '../../model/NodeKind.js';
import type { ASTVisitor, VisitorContext } from '../ASTWalker.js';
import type { GraphBuildContext } from './context.js';
import { addLocatedEdge, registerSymbolNode } from './context.js';
import { toPosixPath } from '../../utils/path.js';

/** Resolves call expressions to their target symbols via TypeChecker. */
export class CallVisitor implements ASTVisitor {
  readonly name = 'CallVisitor';

  constructor(private readonly ctx: GraphBuildContext) {}

  visit(node: ts.Node, vctx: VisitorContext): void {
    if (!ts.isCallExpression(node)) return;

    const callerId = this.resolveCaller(node, vctx);
    const calleeId = this.resolveCallee(node, vctx);
    if (!callerId || !calleeId) return;

    addLocatedEdge(this.ctx, {
      source: callerId,
      target: calleeId,
      kind: EdgeKind.CALLS,
      sourceFile: vctx.sourceFile,
      node,
    });
  }

  private resolveCaller(node: ts.CallExpression, vctx: VisitorContext): string | undefined {
    let current: ts.Node | undefined = node.parent;
    while (current) {
      if (ts.isMethodDeclaration(current) && current.name && ts.isIdentifier(current.name)) {
        const classDecl = current.parent;
        const className =
          ts.isClassDeclaration(classDecl) && classDecl.name ? classDecl.name.text : '';
        const name = className ? `${className}.${current.name.text}` : current.name.text;
        return this.getOrCreateSymbolNode(name, NodeKind.Method, current, vctx);
      }
      if (ts.isFunctionDeclaration(current) && current.name) {
        return this.getOrCreateSymbolNode(current.name.text, NodeKind.Function, current, vctx);
      }
      if (ts.isConstructorDeclaration(current)) {
        const classDecl = current.parent;
        if (ts.isClassDeclaration(classDecl) && classDecl.name) {
          return this.getOrCreateSymbolNode(
            `${classDecl.name.text}.constructor`,
            NodeKind.Constructor,
            current,
            vctx,
          );
        }
      }
      current = current.parent;
    }

    const filePath = toPosixPath(vctx.sourceFile.fileName);
    return this.ctx.fileNodeMap.get(filePath);
  }

  private resolveCallee(node: ts.CallExpression, vctx: VisitorContext): string | undefined {
    const signature = vctx.checker.getResolvedSignature(node);
    if (!signature?.declaration) {
      const symbol = this.ctx.symbolResolver.getSymbolAtLocation(node.expression);
      if (!symbol) return undefined;
      return this.symbolToNodeId(symbol, vctx);
    }

    const decl = signature.declaration;
    const symbol = this.ctx.symbolResolver.getSymbolAtLocation(decl);
    if (!symbol) return undefined;
    return this.symbolToNodeId(symbol, vctx);
  }

  private symbolToNodeId(symbol: ts.Symbol, vctx: VisitorContext): string | undefined {
    const resolved = this.ctx.symbolResolver.resolveAlias(symbol);
    const decl = this.ctx.symbolResolver.getDeclaration(resolved);
    if (!decl) return undefined;

    const name = this.ctx.symbolResolver.getSymbolName(resolved);
    const kind = this.inferKind(resolved, decl);
    const qualifiedName = this.getQualifiedName(resolved, decl, name);

    return this.getOrCreateSymbolNode(qualifiedName, kind, decl, {
      ...vctx,
      sourceFile: decl.getSourceFile(),
    });
  }

  private getQualifiedName(symbol: ts.Symbol, decl: ts.Declaration, name: string): string {
    if (decl.parent && ts.isClassDeclaration(decl.parent) && decl.parent.name) {
      return `${decl.parent.name.text}.${name}`;
    }
    return name;
  }

  private inferKind(symbol: ts.Symbol, decl: ts.Declaration): NodeKind {
    if (symbol.flags & ts.SymbolFlags.Method) return NodeKind.Method;
    if (symbol.flags & ts.SymbolFlags.Function) return NodeKind.Function;
    if (symbol.flags & ts.SymbolFlags.Class) return NodeKind.Class;
    if (symbol.flags & ts.SymbolFlags.Interface) return NodeKind.Interface;
    return NodeKind.Function;
  }

  private getOrCreateSymbolNode(
    name: string,
    kind: NodeKind,
    node: ts.Node,
    vctx: VisitorContext,
  ): string {
    const key = `${vctx.sourceFile.fileName}:${name}`;
    const existing = this.ctx.symbolNodeMap.get(key);
    if (existing) return existing;

    const id = registerSymbolNode(this.ctx, {
      kind,
      name,
      node,
      sourceFile: vctx.sourceFile,
    });
    this.ctx.symbolNodeMap.set(key, id);
    return id;
  }
}
