import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { AnalysisConfig } from '../config/AnalysisConfig.js';
import { GraphBuilder } from '../graph/GraphBuilder.js';
import { Graph } from '../graph/Graph.js';
import type { GraphEdge } from '../model/GraphEdge.js';
import type { GraphNode } from '../model/GraphNode.js';

const CACHE_DIR = '.cli-node-graph';
const CACHE_FILE = 'graph.json';

/** Loads and caches project analysis results. */
export class ProjectLoader {
  private graph: Graph | null = null;
  private config: AnalysisConfig | null = null;

  analyze(config: AnalysisConfig): Graph {
    this.config = config;
    const builder = new GraphBuilder();
    this.graph = builder.build(config);
    this.saveCache(config.projectRoot, this.graph);
    return this.graph;
  }

  getGraph(): Graph | null {
    return this.graph;
  }

  getConfig(): AnalysisConfig | null {
    return this.config;
  }

  loadCache(projectRoot: string): Graph | null {
    try {
      const cachePath = join(resolve(projectRoot), CACHE_DIR, CACHE_FILE);
      const data = JSON.parse(readFileSync(cachePath, 'utf-8')) as {
        nodes: GraphNode[];
        edges: GraphEdge[];
      };

      const graph = new Graph();
      for (const node of data.nodes) {
        graph.addNode(node);
      }
      for (const edge of data.edges) {
        graph.addEdge(edge);
      }
      this.graph = graph;
      return graph;
    } catch {
      return null;
    }
  }

  private saveCache(projectRoot: string, graph: Graph): void {
    const cacheDir = join(resolve(projectRoot), CACHE_DIR);
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(
      join(cacheDir, CACHE_FILE),
      JSON.stringify({ nodes: graph.getNodes(), edges: graph.getEdges() }),
    );
  }
}
