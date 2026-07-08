#!/usr/bin/env node
import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Command } from 'commander';
import { CircularDependencyAnalyzer } from '../analysis/CircularDependencyAnalyzer.js';
import { computeStats } from '../analysis/LayerViolationAnalyzer.js';
import { ImpactAnalyzer } from '../analysis/ImpactAnalyzer.js';
import { CytoscapeExporter } from '../exporters/CytoscapeExporter.js';
import { DotExporter, MermaidExporter } from '../exporters/DotExporter.js';
import { GraphMLExporter } from '../exporters/GraphMLExporter.js';
import { JsonExporter } from '../exporters/JsonExporter.js';
import { Neo4jExporter, ReactFlowExporter } from '../exporters/CytoscapeExporter.js';
import type { GraphExporter } from '../exporters/GraphExporter.js';
import { ProjectLoader } from './ProjectLoader.js';

const program = new Command();
const loader = new ProjectLoader();

program
  .name('cli-node-graph')
  .description('TypeScript codebase knowledge graph analyzer')
  .version('1.0.1');

program
  .command('analyze')
  .description('Analyze a TypeScript project and build the dependency graph')
  .argument('[path]', 'Project root path', '.')
  .option('--tsconfig <path>', 'Path to tsconfig.json', 'tsconfig.json')
  .action((path: string, options: { tsconfig: string }) => {
    const projectRoot = resolve(path);
    console.error(`Analyzing ${projectRoot}...`);
    const graph = loader.analyze({ projectRoot, tsconfigPath: options.tsconfig });
    console.error(`Done: ${String(graph.nodeCount)} nodes, ${String(graph.edgeCount)} edges`);
    console.log(JSON.stringify({ nodeCount: graph.nodeCount, edgeCount: graph.edgeCount }));
  });

program
  .command('graph')
  .description('Show summary of the last analyzed graph')
  .argument('[path]', 'Project root path', '.')
  .action((path: string) => {
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(resolve(path));
    if (!graph) {
      console.error('No graph found. Run: cli-node-graph analyze');
      process.exit(1);
    }
    const stats = computeStats(graph);
    console.log(JSON.stringify(stats, null, 2));
  });

program
  .command('export')
  .description('Export the graph to a file format')
  .argument('[path]', 'Project root path', '.')
  .requiredOption('--format <format>', 'Export format (json|dot|graphml|cytoscape|reactflow|neo4j|mermaid)')
  .option('-o, --output <file>', 'Output file path')
  .action((path: string, options: { format: string; output?: string }) => {
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(resolve(path));
    if (!graph) {
      graph = loader.analyze({ projectRoot: resolve(path) });
    }

    const exporter = getExporter(options.format);
    const output = exporter.export(graph);
    const outFile = options.output ?? `cli-node-graph.${options.format === 'reactflow' ? 'json' : options.format}`;

    if (options.output || !process.stdout.isTTY) {
      writeFileSync(outFile, output);
      console.error(`Exported to ${outFile}`);
    } else {
      console.log(output);
    }
  });

program
  .command('cycles')
  .description('Detect circular dependencies')
  .argument('[path]', 'Project root path', '.')
  .action((path: string) => {
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(resolve(path));
    if (!graph) {
      graph = loader.analyze({ projectRoot: resolve(path) });
    }

    const analyzer = new CircularDependencyAnalyzer();
    const cycles = analyzer.analyze(graph);
    console.log(JSON.stringify(cycles, null, 2));
  });

program
  .command('impact')
  .description('Analyze downstream impact of a file or symbol')
  .argument('<target>', 'File path or node id')
  .argument('[path]', 'Project root path', '.')
  .action((target: string, path: string) => {
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(resolve(path));
    if (!graph) {
      graph = loader.analyze({ projectRoot: resolve(path) });
    }

    const analyzer = new ImpactAnalyzer();
    const fileNode = graph.getNodes().find((n) => n.file?.includes(target) || n.id === target);
    if (!fileNode) {
      console.error(`Node not found: ${target}`);
      process.exit(1);
    }

    const report = analyzer.analyze(graph, fileNode.id);
    console.log(JSON.stringify(report, null, 2));
  });

program
  .command('stats')
  .description('Show graph statistics')
  .argument('[path]', 'Project root path', '.')
  .action((path: string) => {
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(resolve(path));
    if (!graph) {
      graph = loader.analyze({ projectRoot: resolve(path) });
    }

    const stats = computeStats(graph);
    console.log(JSON.stringify(stats, null, 2));
  });

program
  .command('view')
  .description('Visualize the project dependency graph in the browser')
  .argument('[path]', 'Project root path', '.')
  .option('--tsconfig <path>', 'Path to tsconfig.json', 'tsconfig.json')
  .option('--port <number>', 'Local server port', '5173')
  .option('--no-open', 'Do not automatically open the browser')
  .action((path: string, options: { tsconfig: string; port: string; open: boolean }) => {
    const projectRoot = resolve(path);
    const port = parseInt(options.port, 10);

    // 1. Analyze the project
    console.error(`\n🔍 Analyzing ${projectRoot}...`);
    let graph = loader.getGraph();
    if (!graph) graph = loader.loadCache(projectRoot);
    if (!graph) {
      graph = loader.analyze({ projectRoot, tsconfigPath: options.tsconfig });
    }
    console.error(`✅ Graph ready: ${String(graph.nodeCount)} nodes, ${String(graph.edgeCount)} edges`);

    // 2. Export as ReactFlow JSON
    const exporter = new ReactFlowExporter();
    const graphJson = exporter.export(graph);

    // 3. Locate the pre-built visualization app
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const vizDir = join(__dirname, '../../visualization/dist');

    if (!existsSync(vizDir)) {
      console.error(
        `\n❌ Visualization app not found at ${vizDir}\n` +
        `   Please run: cd visualization && pnpm build\n`,
      );
      process.exit(1);
    }

    // 4. Start a minimal HTTP server
    const MIME: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
    };

    const server = createServer((req, res) => {
      // Strip query strings / hash fragments before resolving paths
      const pathname = new URL(req.url ?? '/', `http://localhost:${port}`).pathname;

      // Serve the live graph data
      if (pathname === '/graph-data.json') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(graphJson);
        return;
      }

      // Serve static files, SPA fallback to index.html
      let filePath = join(vizDir, pathname === '/' ? 'index.html' : pathname);
      if (!existsSync(filePath)) {
        filePath = join(vizDir, 'index.html');
      }

      try {
        const content = readFileSync(filePath);
        const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.error(`\n✨ Graph visualization ready at ${url}`);
      console.error('   Press Ctrl+C to stop.\n');

      // 5. Open browser
      if (options.open) {
        const openers =
          process.platform === 'win32' ? [['cmd', ['/c', 'start', url]]] :
          process.platform === 'darwin' ? [['open', [url]]] :
          [['xdg-open', [url]], ['sensible-browser', [url]], ['firefox', [url]], ['chromium-browser', [url]]];

        const tryOpen = (list: [string, string[]][]) => {
          if (list.length === 0) {
            console.error(`   Open your browser at: ${url}`);
            return;
          }
          const [[cmd, args], ...rest] = list;
          const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
          child.on('error', () => tryOpen(rest)); // try next opener on failure
          child.unref();
        };

        tryOpen(openers as [string, string[]][]);
      }
    });

    // Keep process alive
    process.on('SIGINT', () => {
      server.close();
      console.error('\n👋 Server stopped.');
      process.exit(0);
    });
  });

function getExporter(format: string): GraphExporter {
  const exporters: Record<string, GraphExporter> = {
    json: new JsonExporter(),
    dot: new DotExporter(),
    graphml: new GraphMLExporter(),
    cytoscape: new CytoscapeExporter(),
    reactflow: new ReactFlowExporter(),
    neo4j: new Neo4jExporter(),
    mermaid: new MermaidExporter(),
  };
  const exporter = exporters[format];
  if (!exporter) {
    console.error(`Unknown format: ${format}. Available: ${Object.keys(exporters).join(', ')}`);
    process.exit(1);
  }
  return exporter;
}

program.parse();
