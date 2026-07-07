import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactFlowExport, LayoutType } from './types';
import { applyLayout, findPath, kindColor } from './layout';

const SAMPLE_GRAPH: ReactFlowExport = {
  nodes: [
    { id: 'File:controller', position: { x: 0, y: 0 }, data: { id: 'File:controller', label: 'user.controller.ts', kind: 'File', file: 'src/presentation/user.controller.ts' } },
    { id: 'Class:Controller', position: { x: 0, y: 0 }, data: { id: 'Class:Controller', label: 'UserController', kind: 'Class', file: 'src/presentation/user.controller.ts' } },
    { id: 'Class:Service', position: { x: 0, y: 0 }, data: { id: 'Class:Service', label: 'UserService', kind: 'Class', file: 'src/application/user.service.ts' } },
    { id: 'Interface:Repo', position: { x: 0, y: 0 }, data: { id: 'Interface:Repo', label: 'UserRepository', kind: 'Interface', file: 'src/domain/user.repository.ts' } },
    { id: 'Class:RepoImpl', position: { x: 0, y: 0 }, data: { id: 'Class:RepoImpl', label: 'InMemoryUserRepository', kind: 'Class', file: 'src/infrastructure/in-memory-user.repository.ts' } },
  ],
  edges: [
    { id: 'e1', source: 'Class:Controller', target: 'Class:Service', label: 'CALLS' },
    { id: 'e2', source: 'Class:Service', target: 'Interface:Repo', label: 'TYPE_REFERENCE' },
    { id: 'e3', source: 'Class:RepoImpl', target: 'Interface:Repo', label: 'IMPLEMENTS' },
    { id: 'e4', source: 'Class:Controller', target: 'Class:RepoImpl', label: 'CREATES' },
    { id: 'e5', source: 'File:controller', target: 'Class:Controller', label: 'CONTAINS' },
  ],
};

const NODE_KINDS = ['Class', 'Interface', 'Function', 'Method', 'File', 'Folder', 'Package', 'Enum'];
const EDGE_KINDS = ['IMPORTS', 'CALLS', 'EXTENDS', 'IMPLEMENTS', 'DEPENDS_ON', 'CONTAINS'];

function toFlowNodes(exportData: ReactFlowExport): Node[] {
  return exportData.nodes.map((n) => ({
    id: n.id,
    position: n.position,
    data: {
      label: n.data.label,
      kind: n.data.kind,
      file: n.data.file,
      line: n.data.line,
    },
    style: {
      background: kindColor(n.data.kind),
      color: '#fff',
      border: '1px solid #334155',
      borderRadius: 8,
      fontSize: 12,
      padding: 8,
      width: 180,
    },
  }));
}

function toFlowEdges(exportData: ReactFlowExport): Edge[] {
  return exportData.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.label === 'CALLS',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
  }));
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('');
  const [selectedEdgeKind, setSelectedEdgeKind] = useState<string>('');
  const [layout, setLayout] = useState<LayoutType>('dagre');
  const [pathStart, setPathStart] = useState('');
  const [pathEnd, setPathEnd] = useState('');
  const [highlightPath, setHighlightPath] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const initialNodes = useMemo(() => toFlowNodes(SAMPLE_GRAPH), []);
  const initialEdges = useMemo(() => toFlowEdges(SAMPLE_GRAPH), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const applyFilters = useCallback(() => {
    let filteredNodes = toFlowNodes(SAMPLE_GRAPH);
    let filteredEdges = toFlowEdges(SAMPLE_GRAPH);

    if (search) {
      const q = search.toLowerCase();
      filteredNodes = filteredNodes.filter(
        (n) =>
          String(n.data.label).toLowerCase().includes(q) ||
          String(n.data.file ?? '').toLowerCase().includes(q),
      );
    }

    if (selectedKind) {
      filteredNodes = filteredNodes.filter((n) => n.data.kind === selectedKind);
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    filteredEdges = filteredEdges.filter((e) => {
      if (selectedEdgeKind && e.label !== selectedEdgeKind) return false;
      return nodeIds.has(e.source) && nodeIds.has(e.target);
    });

    if (collapsedFolders.size > 0) {
      filteredNodes = filteredNodes.filter((n) => {
        const file = String(n.data.file ?? '');
        return ![...collapsedFolders].some((folder) => file.includes(folder));
      });
    }

    const laid = applyLayout(filteredNodes, filteredEdges, layout);

    if (highlightPath.length > 0) {
      const pathSet = new Set(highlightPath);
      laid.forEach((n) => {
        n.style = {
          ...n.style,
          opacity: pathSet.has(n.id) ? 1 : 0.3,
          border: pathSet.has(n.id) ? '2px solid #fbbf24' : n.style?.border,
        };
      });
    }

    setNodes(laid);
    setEdges(filteredEdges);
  }, [search, selectedKind, selectedEdgeKind, layout, highlightPath, collapsedFolders, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      const neighborIds = new Set<string>([node.id]);
      edges.forEach((e) => {
        if (e.source === node.id) neighborIds.add(e.target);
        if (e.target === node.id) neighborIds.add(e.source);
      });
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          style: {
            ...n.style,
            opacity: neighborIds.has(n.id) ? 1 : 0.25,
          },
        })),
      );
    },
    [edges, setNodes],
  );

  const handleFindPath = useCallback(() => {
    const path = findPath(pathStart, pathEnd, edges);
    setHighlightPath(path ?? []);
    applyFilters();
  }, [pathStart, pathEnd, edges, applyFilters]);

  const handleLoadFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as ReactFlowExport;
          const flowNodes = applyLayout(toFlowNodes(data), toFlowEdges(data), layout);
          setNodes(flowNodes);
          setEdges(toFlowEdges(data));
        } catch {
          alert('Invalid graph JSON file');
        }
      };
      reader.readAsText(file);
    },
    [layout, setNodes, setEdges],
  );

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color={darkMode ? '#334155' : '#e2e8f0'} />
        <Controls />
        <MiniMap nodeColor={(n) => kindColor(String(n.data?.kind ?? ''))} />

        <Panel position="top-left" className="panel">
          <h1>CLI Node Graph</h1>
          <input
            type="text"
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={selectedKind} onChange={(e) => setSelectedKind(e.target.value)}>
            <option value="">All node types</option>
            {NODE_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select value={selectedEdgeKind} onChange={(e) => setSelectedEdgeKind(e.target.value)}>
            <option value="">All edge types</option>
            {EDGE_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select value={layout} onChange={(e) => setLayout(e.target.value as LayoutType)}>
            <option value="dagre">Dagre</option>
            <option value="hierarchical">Hierarchical</option>
            <option value="radial">Radial</option>
            <option value="force">Force Directed</option>
          </select>
          <button type="button" onClick={applyFilters}>Apply Filters</button>
          <button type="button" onClick={() => setDarkMode((d) => !d)}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <label className="file-input">
            Load Graph JSON
            <input type="file" accept=".json" onChange={handleLoadFile} />
          </label>
        </Panel>

        <Panel position="top-right" className="panel">
          <h3>Path Finder</h3>
          <input
            placeholder="Start node id"
            value={pathStart}
            onChange={(e) => setPathStart(e.target.value)}
          />
          <input
            placeholder="End node id"
            value={pathEnd}
            onChange={(e) => setPathEnd(e.target.value)}
          />
          <button type="button" onClick={handleFindPath}>Find Path</button>
          {highlightPath.length > 0 && (
            <p className="path-result">Path: {highlightPath.join(' → ')}</p>
          )}
        </Panel>

        {selectedNode && (
          <Panel position="bottom-right" className="panel metadata-panel">
            <h3>{String(selectedNode.data.label)}</h3>
            <dl>
              <dt>Kind</dt>
              <dd>{String(selectedNode.data.kind)}</dd>
              <dt>File</dt>
              <dd>{String(selectedNode.data.file ?? 'N/A')}</dd>
              <dt>Line</dt>
              <dd>{String(selectedNode.data.line ?? 'N/A')}</dd>
              <dt>ID</dt>
              <dd className="mono">{selectedNode.id}</dd>
            </dl>
            <button type="button" onClick={() => setSelectedNode(null)}>Close</button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
