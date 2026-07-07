import ts from 'typescript';
import { LookupCache } from '../utils/cache.js';
import { toPosixPath } from '../utils/path.js';

/** Resolves TypeScript symbols to their original declarations. */
export class SymbolResolver {
  private readonly cache = new LookupCache<string, ts.Symbol | undefined>();

  constructor(private readonly checker: ts.TypeChecker) {}

  getSymbolAtLocation(node: ts.Node): ts.Symbol | undefined {
    const key = `${node.getSourceFile().fileName}:${node.getStart()}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    const symbol = this.checker.getSymbolAtLocation(node);
    const resolved = symbol ? this.resolveAlias(symbol) : undefined;
    this.cache.set(key, resolved);
    return resolved;
  }

  resolveAlias(symbol: ts.Symbol): ts.Symbol {
    if (symbol.flags & ts.SymbolFlags.Alias) {
      return this.checker.getAliasedSymbol(symbol);
    }
    return symbol;
  }

  getDeclaration(symbol: ts.Symbol): ts.Declaration | undefined {
    return symbol.valueDeclaration ?? symbol.declarations?.[0];
  }

  getDeclarationFile(symbol: ts.Symbol): string | undefined {
    const decl = this.getDeclaration(symbol);
    if (!decl) return undefined;
    return toPosixPath(decl.getSourceFile().fileName);
  }

  getSymbolName(symbol: ts.Symbol): string {
    return symbol.getName();
  }

  getExportsOfModule(sourceFile: ts.SourceFile): ts.Symbol[] {
    const moduleSymbol = this.checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) return [];
    return this.checker.getExportsOfModule(moduleSymbol);
  }

  getEnclosingSymbol(node: ts.Node): ts.Symbol | undefined {
    let current: ts.Node | undefined = node;
    while (current) {
      const symbol = this.getSymbolAtLocation(current);
      if (
        symbol &&
        symbol.flags &
          (ts.SymbolFlags.Class |
            ts.SymbolFlags.Function |
            ts.SymbolFlags.Method |
            ts.SymbolFlags.Interface)
      ) {
        return symbol;
      }
      current = current.parent;
    }
    return undefined;
  }
}
