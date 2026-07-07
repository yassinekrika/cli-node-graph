export interface GraphNodeData {
  id: string;
  label: string;
  kind: string;
  file?: string;
  line?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  kind: string;
}

export interface ReactFlowExport {
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: GraphNodeData;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
    data?: Record<string, unknown>;
  }[];
}

export type LayoutType = 'dagre' | 'hierarchical' | 'radial' | 'force';
