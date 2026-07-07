import type { LayerRule } from '../config/AnalysisConfig.js';
import type { Graph } from '../graph/Graph.js';
import { EdgeKind } from '../model/EdgeKind.js';
import { NodeKind } from '../model/NodeKind.js';

/** Detects layer architecture violations. */
export class LayerViolationAnalyzer {
  analyze(graph: Graph, rules: LayerRule[]): LayerViolationReport[] {
    const violations: LayerViolationReport[] = [];
    const layerMap = this.buildLayerMap(rules);

    for (const edge of graph.getEdgesByKind(EdgeKind.IMPORTS)) {
      const sourceNode = graph.getNode(edge.source);
      const targetNode = graph.getNode(edge.target);
      if (!sourceNode?.file || !targetNode?.file) continue;

      const sourceLayer = this.resolveLayer(sourceNode.file, layerMap);
      const targetLayer = this.resolveLayer(targetNode.file, layerMap);
      if (!sourceLayer || !targetLayer) continue;

      const sourceRule = rules.find((r) => r.name === sourceLayer);
      if (!sourceRule?.allowedImports) continue;

      if (!sourceRule.allowedImports.includes(targetLayer)) {
        violations.push({
          source: edge.source,
          target: edge.target,
          sourceLayer,
          targetLayer,
          sourceFile: sourceNode.file,
          targetFile: targetNode.file,
        });
      }
    }

    return violations;
  }

  private buildLayerMap(rules: LayerRule[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const rule of rules) {
      map.set(rule.name, rule.name);
    }
    return map;
  }

  private resolveLayer(filePath: string, _layerMap: Map<string, string>): string | undefined {
    for (const [layer] of _layerMap) {
      const rule = layer;
      if (filePath.includes(`/${rule.toLowerCase()}/`) || filePath.includes(`\\${rule.toLowerCase()}\\`)) {
        return layer;
      }
    }
    return undefined;
  }
}

/** A single layer violation. */
export interface LayerViolationReport {
  source: string;
  target: string;
  sourceLayer: string;
  targetLayer: string;
  sourceFile: string;
  targetFile: string;
}

/** Computes graph statistics. */
export function computeStats(graph: Graph): GraphStats {
  const nodesByKind: Record<string, number> = {};
  const edgesByKind: Record<string, number> = {};

  for (const node of graph.getNodes()) {
    nodesByKind[node.kind] = (nodesByKind[node.kind] ?? 0) + 1;
  }
  for (const edge of graph.getEdges()) {
    edgesByKind[edge.kind] = (edgesByKind[edge.kind] ?? 0) + 1;
  }

  return {
    nodeCount: graph.nodeCount,
    edgeCount: graph.edgeCount,
    fileCount: graph.getNodesByKind(NodeKind.File).length,
    classCount: graph.getNodesByKind(NodeKind.Class).length,
    functionCount: graph.getNodesByKind(NodeKind.Function).length,
    interfaceCount: graph.getNodesByKind(NodeKind.Interface).length,
    nodesByKind,
    edgesByKind,
  };
}

/** Summary statistics for a graph. */
export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  fileCount: number;
  classCount: number;
  functionCount: number;
  interfaceCount: number;
  nodesByKind: Record<string, number>;
  edgesByKind: Record<string, number>;
}
