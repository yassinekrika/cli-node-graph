import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { LayoutType } from './types';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

export function applyLayout(
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType,
): Node[] {
  switch (layout) {
    case 'dagre':
    case 'hierarchical':
      return dagreLayout(nodes, edges, layout === 'hierarchical' ? 'TB' : 'LR');
    case 'radial':
      return radialLayout(nodes);
    case 'force':
      return forceLayout(nodes, edges);
    default:
      return nodes;
  }
}

function dagreLayout(nodes: Node[], edges: Edge[], rankdir: 'TB' | 'LR'): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir, nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id) as { x: number; y: number };
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

function radialLayout(nodes: Node[]): Node[] {
  const centerX = 400;
  const centerY = 400;
  const radius = Math.max(200, nodes.length * 15);
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });
}

function forceLayout(nodes: Node[], edges: Edge[]): Node[] {
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  nodes.forEach((node, i) => {
    positions.set(node.id, {
      x: (i % 10) * 150,
      y: Math.floor(i / 10) * 100,
      vx: 0,
      vy: 0,
    });
  });

  for (let iter = 0; iter < 50; iter++) {
    for (const node of nodes) {
      const pos = positions.get(node.id)!;
      for (const other of nodes) {
        if (other.id === node.id) continue;
        const otherPos = positions.get(other.id)!;
        const dx = pos.x - otherPos.x;
        const dy = pos.y - otherPos.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 5000 / (dist * dist);
        pos.vx += (dx / dist) * force;
        pos.vy += (dy / dist) * force;
      }
    }

    for (const edge of edges) {
      const source = positions.get(edge.source);
      const target = positions.get(edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      source.vx += dx * 0.01;
      source.vy += dy * 0.01;
      target.vx -= dx * 0.01;
      target.vy -= dy * 0.01;
    }

    for (const [, pos] of positions) {
      pos.x += pos.vx * 0.1;
      pos.y += pos.vy * 0.1;
      pos.vx *= 0.9;
      pos.vy *= 0.9;
    }
  }

  return nodes.map((node) => ({
    ...node,
    position: { x: positions.get(node.id)!.x, y: positions.get(node.id)!.y },
  }));
}

export function findPath(
  startId: string,
  endId: string,
  edges: Edge[],
): string[] | null {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const visited = new Set<string>([startId]);
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    for (const neighbor of adjacency.get(id) ?? []) {
      if (neighbor === endId) return [...path, neighbor];
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return null;
}

const KIND_COLORS: Record<string, string> = {
  Class: '#3b82f6',
  Interface: '#8b5cf6',
  Function: '#10b981',
  Method: '#06b6d4',
  File: '#64748b',
  Folder: '#94a3b8',
  Package: '#f59e0b',
  Enum: '#ec4899',
  Variable: '#6366f1',
};

export function kindColor(kind: string): string {
  return KIND_COLORS[kind] ?? '#475569';
}
