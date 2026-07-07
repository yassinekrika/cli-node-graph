import type { GraphEdge } from '../model/GraphEdge.js';
import type { Graph } from './Graph.js';
import { EdgeKind } from '../model/EdgeKind.js';

/** Graph algorithms for dependency analysis. */
export class GraphAlgorithms {
  constructor(private readonly graph: Graph) {}

  /** Kahn's algorithm topological sort. Returns empty if cycles exist. */
  topologicalSort(nodeIds?: string[]): string[] {
    const ids = nodeIds ?? this.graph.getNodes().map((n) => n.id);
    const idSet = new Set(ids);
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const id of ids) {
      inDegree.set(id, 0);
      adjacency.set(id, []);
    }

    for (const edge of this.graph.getEdges()) {
      if (!idSet.has(edge.source) || !idSet.has(edge.target)) continue;
      if (this.isDependencyEdge(edge)) {
        adjacency.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      }
    }

    const queue = [...ids].filter((id) => (inDegree.get(id) ?? 0) === 0);
    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        const deg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) queue.push(neighbor);
      }
    }

    return result.length === ids.length ? result : [];
  }

  /** Tarjan's algorithm for strongly connected components. */
  stronglyConnectedComponents(nodeIds?: string[]): string[][] {
    const ids = nodeIds ?? this.graph.getNodes().map((n) => n.id);
    const idSet = new Set(ids);
    const adjacency = this.buildAdjacencyList(idSet, true);
    let index = 0;
    const stack: string[] = [];
    const onStack = new Set<string>();
    const indices = new Map<string, number>();
    const lowLink = new Map<string, number>();
    const components: string[][] = [];

    const strongConnect = (v: string): void => {
      indices.set(v, index);
      lowLink.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      for (const w of adjacency.get(v) ?? []) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowLink.set(v, Math.min(lowLink.get(v)!, lowLink.get(w)!));
        } else if (onStack.has(w)) {
          lowLink.set(v, Math.min(lowLink.get(v)!, indices.get(w)!));
        }
      }

      if (lowLink.get(v) === indices.get(v)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== v);
        components.push(component);
      }
    };

    for (const id of ids) {
      if (!indices.has(id)) strongConnect(id);
    }

    return components;
  }

  /** Detect all cycles (SCCs with more than one node or self-loops). */
  detectCycles(): string[][] {
    const selfLoops = this.graph
      .getEdges()
      .filter((e) => e.source === e.target)
      .map((e) => [e.source]);

    const sccs = this.stronglyConnectedComponents().filter((c) => c.length > 1);
    return [...selfLoops, ...sccs];
  }

  /** BFS shortest path between two nodes. */
  shortestPath(from: string, to: string): string[] | null {
    if (from === to) return [from];
    const adjacency = this.buildAdjacencyList(new Set(this.graph.getNodes().map((n) => n.id)), true);
    const visited = new Set<string>([from]);
    const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      for (const neighbor of adjacency.get(node) ?? []) {
        if (neighbor === to) return [...path, neighbor];
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }
    return null;
  }

  /** Maximum dependency depth from a node. */
  dependencyDepth(nodeId: string): number {
    const adjacency = this.buildAdjacencyList(new Set(this.graph.getNodes().map((n) => n.id)), true);
    const memo = new Map<string, number>();

    const depth = (id: string, visiting: Set<string>): number => {
      if (memo.has(id)) return memo.get(id)!;
      if (visiting.has(id)) return 0;
      visiting.add(id);
      let max = 0;
      for (const neighbor of adjacency.get(id) ?? []) {
        max = Math.max(max, 1 + depth(neighbor, visiting));
      }
      visiting.delete(id);
      memo.set(id, max);
      return max;
    };

    return depth(nodeId, new Set());
  }

  /** Get all nodes reachable downstream from a starting node. */
  downstream(nodeId: string): Set<string> {
    const adjacency = this.buildAdjacencyList(new Set(this.graph.getNodes().map((n) => n.id)), true);
    const result = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!result.has(neighbor)) {
          result.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    return result;
  }

  /** Get all nodes that depend on a given node (reverse lookup). */
  reverseDependencies(nodeId: string): Set<string> {
    const adjacency = this.buildAdjacencyList(new Set(this.graph.getNodes().map((n) => n.id)), false);
    const result = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!result.has(neighbor)) {
          result.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    return result;
  }

  /** Expand neighborhood to N hops. */
  neighborhood(nodeId: string, hops: number): Set<string> {
    const result = new Set<string>([nodeId]);
    let frontier = new Set<string>([nodeId]);

    for (let i = 0; i < hops; i++) {
      const next = new Set<string>();
      for (const id of frontier) {
        for (const edge of [...this.graph.getOutgoingEdges(id), ...this.graph.getIncomingEdges(id)]) {
          const neighbor = edge.source === id ? edge.target : edge.source;
          if (!result.has(neighbor)) {
            result.add(neighbor);
            next.add(neighbor);
          }
        }
      }
      frontier = next;
    }
    return result;
  }

  /** Compute transitive closure for dependency edges. */
  transitiveClosure(nodeIds: string[]): Set<string> {
    const idSet = new Set(nodeIds);
    const adjacency = this.buildAdjacencyList(idSet, true);
    const closure = new Set<string>();

    for (const start of nodeIds) {
      const reachable = this.downstreamFromAdjacency(start, adjacency);
      for (const node of reachable) {
        closure.add(`${start}->${node}`);
      }
    }
    return closure;
  }

  private downstreamFromAdjacency(start: string, adjacency: Map<string, string[]>): Set<string> {
    const result = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!result.has(neighbor)) {
          result.add(neighbor);
          stack.push(neighbor);
        }
      }
    }
    return result;
  }

  private buildAdjacencyList(nodeIds: Set<string>, forward: boolean): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();
    for (const id of nodeIds) adjacency.set(id, []);

    for (const edge of this.graph.getEdges()) {
      if (!this.isDependencyEdge(edge)) continue;
      const src = forward ? edge.source : edge.target;
      const tgt = forward ? edge.target : edge.source;
      if (nodeIds.has(src) && nodeIds.has(tgt)) {
        adjacency.get(src)?.push(tgt);
      }
    }
    return adjacency;
  }

  private isDependencyEdge(edge: GraphEdge): boolean {
    return (
      edge.kind === EdgeKind.DEPENDS_ON ||
      edge.kind === EdgeKind.IMPORTS ||
      edge.kind === EdgeKind.CALLS ||
      edge.kind === EdgeKind.EXTENDS ||
      edge.kind === EdgeKind.IMPLEMENTS
    );
  }
}
