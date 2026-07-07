import ts from 'typescript';

/** Context passed to every AST visitor. */
export interface VisitorContext {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  program: ts.Program;
  projectRoot: string;
}

/** A visitor that processes AST nodes during a single traversal. */
export interface ASTVisitor {
  readonly name: string;
  visit(node: ts.Node, ctx: VisitorContext): void;
}

/** Walks all source files once, dispatching to registered visitors. */
export class ASTWalker {
  constructor(private readonly visitors: ASTVisitor[]) {}

  walk(sourceFiles: ts.SourceFile[], ctx: Omit<VisitorContext, 'sourceFile'>): void {
    for (const sourceFile of sourceFiles) {
      const fileCtx: VisitorContext = { ...ctx, sourceFile };
      this.walkNode(sourceFile, fileCtx);
    }
  }

  private walkNode(node: ts.Node, ctx: VisitorContext): void {
    for (const visitor of this.visitors) {
      visitor.visit(node, ctx);
    }
    ts.forEachChild(node, (child) => {
      this.walkNode(child, ctx);
    });
  }
}
