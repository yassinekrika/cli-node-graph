import type { GraphEdge } from '../model/GraphEdge.js';
import type { GraphNode } from '../model/GraphNode.js';
import type { EdgeKind } from '../model/EdgeKind.js';
import type { NodeKind } from '../model/NodeKind.js';

/** In-memory graph database with indexed lookups. */
export class Graph {
  private readonly nodes = new Map<string, GraphNode>();
  private readonly edges = new Map<string, GraphEdge>();
  private readonly nodesByKind = new Map<NodeKind, Set<string>>();
  private readonly edgesByKind = new Map<EdgeKind, Set<string>>();
  private readonly outgoing = new Map<string, Set<string>>();
  private readonly incoming = new Map<string, Set<string>>();
  private readonly nodesByFile = new Map<string, Set<string>>();

  /** Add or replace a node. */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    this.indexNodeByKind(node);
    if (node.file) {
      let fileSet = this.nodesByFile.get(node.file);
      if (!fileSet) {
        fileSet = new Set();
        this.nodesByFile.set(node.file, fileSet);
      }
      fileSet.add(node.id);
    }
  }

  /** Add an edge if it does not already exist. */
  addEdge(edge: GraphEdge): void {
    if (this.edges.has(edge.id)) {
      return;
    }
    this.edges.set(edge.id, edge);
    this.indexEdgeByKind(edge);
    this.indexAdjacency(edge);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id);
  }

  getNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  getEdges(): GraphEdge[] {
    return [...this.edges.values()];
  }

  getNodesByKind(kind: NodeKind): GraphNode[] {
    const ids = this.nodesByKind.get(kind);
    if (!ids) return [];
    return [...ids].map((id) => this.nodes.get(id)).filter((n): n is GraphNode => n !== undefined);
  }

  getEdgesByKind(kind: EdgeKind): GraphEdge[] {
    const ids = this.edgesByKind.get(kind);
    if (!ids) return [];
    return [...ids].map((id) => this.edges.get(id)).filter((e): e is GraphEdge => e !== undefined);
  }

  getNodesByFile(file: string): GraphNode[] {
    const ids = this.nodesByFile.get(file);
    if (!ids) return [];
    return [...ids].map((id) => this.nodes.get(id)).filter((n): n is GraphNode => n !== undefined);
  }

  getOutgoingEdges(nodeId: string): GraphEdge[] {
    const ids = this.outgoing.get(nodeId);
    if (!ids) return [];
    return [...ids].map((id) => this.edges.get(id)).filter((e): e is GraphEdge => e !== undefined);
  }

  getIncomingEdges(nodeId: string): GraphEdge[] {
    const ids = this.incoming.get(nodeId);
    if (!ids) return [];
    return [...ids].map((id) => this.edges.get(id)).filter((e): e is GraphEdge => e !== undefined);
  }

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  /** Create a shallow copy of the graph. */
  clone(): Graph {
    const copy = new Graph();
    for (const node of this.nodes.values()) {
      copy.addNode({ ...node, metadata: { ...node.metadata } });
    }
    for (const edge of this.edges.values()) {
      copy.addEdge({ ...edge, metadata: { ...edge.metadata } });
    }
    return copy;
  }

  /** Filter graph to a subset of nodes and their connecting edges. */
  filter(nodeIds: Set<string>): Graph {
    const filtered = new Graph();
    for (const id of nodeIds) {
      const node = this.nodes.get(id);
      if (node) filtered.addNode(node);
    }
    for (const edge of this.edges.values()) {
      if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
        filtered.addEdge(edge);
      }
    }
    return filtered;
  }

  private indexNodeByKind(node: GraphNode): void {
    let set = this.nodesByKind.get(node.kind);
    if (!set) {
      set = new Set();
      this.nodesByKind.set(node.kind, set);
    }
    set.add(node.id);
  }

  private indexEdgeByKind(edge: GraphEdge): void {
    let set = this.edgesByKind.get(edge.kind);
    if (!set) {
      set = new Set();
      this.edgesByKind.set(edge.kind, set);
    }
    set.add(edge.id);
  }

  private indexAdjacency(edge: GraphEdge): void {
    let outSet = this.outgoing.get(edge.source);
    if (!outSet) {
      outSet = new Set();
      this.outgoing.set(edge.source, outSet);
    }
    outSet.add(edge.id);

    let inSet = this.incoming.get(edge.target);
    if (!inSet) {
      inSet = new Set();
      this.incoming.set(edge.target, inSet);
    }
    inSet.add(edge.id);
  }
}
