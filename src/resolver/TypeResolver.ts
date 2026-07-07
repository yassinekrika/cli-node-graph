import ts from 'typescript';
import { LookupCache } from '../utils/cache.js';

/** Resolves TypeScript types at AST locations. */
export class TypeResolver {
  private readonly cache = new LookupCache<string, ts.Type>();

  constructor(private readonly checker: ts.TypeChecker) {}

  getTypeAtLocation(node: ts.Node): ts.Type {
    const key = `${node.getSourceFile().fileName}:${node.getStart()}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const type = this.checker.getTypeAtLocation(node);
    this.cache.set(key, type);
    return type;
  }

  getCallSignature(type: ts.Type): ts.Signature | undefined {
    return type.getCallSignatures()[0];
  }

  getReturnType(signature: ts.Signature): ts.Type {
    return this.checker.getReturnTypeOfSignature(signature);
  }

  getTypeName(type: ts.Type): string {
    return this.checker.typeToString(type);
  }

  isPromise(type: ts.Type): boolean {
    const symbol = type.getSymbol();
    return symbol?.getName() === 'Promise';
  }
}
