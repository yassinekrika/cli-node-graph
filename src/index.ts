export type { AnalysisConfig, LayerRule } from './config/AnalysisConfig.js';
export { DEFAULT_CONFIG } from './config/AnalysisConfig.js';

export { NodeKind } from './model/NodeKind.js';
export { EdgeKind } from './model/EdgeKind.js';
export type { GraphNode, SourceRange, NodeMetadata } from './model/GraphNode.js';
export type { GraphEdge, EdgeMetadata, EdgeConfidence } from './model/GraphEdge.js';

export { Graph } from './graph/Graph.js';
export { GraphBuilder } from './graph/GraphBuilder.js';
export { GraphAlgorithms } from './graph/GraphAlgorithms.js';
export { NodeFactory } from './graph/NodeFactory.js';
export { EdgeFactory } from './graph/EdgeFactory.js';

export { ProgramFactory } from './parser/ProgramFactory.js';
export type { ProgramResult } from './parser/ProgramFactory.js';
export { ASTWalker } from './parser/ASTWalker.js';
export type { ASTVisitor, VisitorContext } from './parser/ASTWalker.js';

export { ModuleResolver, PathResolver } from './resolver/ModuleResolver.js';
export { SymbolResolver } from './resolver/SymbolResolver.js';
export { TypeResolver } from './resolver/TypeResolver.js';

export { CircularDependencyAnalyzer } from './analysis/CircularDependencyAnalyzer.js';
export type { CycleReport } from './analysis/CircularDependencyAnalyzer.js';
export { DeadCodeAnalyzer } from './analysis/DeadCodeAnalyzer.js';
export type { DeadCodeReport } from './analysis/DeadCodeAnalyzer.js';
export { ImpactAnalyzer } from './analysis/ImpactAnalyzer.js';
export type { ImpactReport } from './analysis/ImpactAnalyzer.js';
export { DependencyAnalyzer } from './analysis/DependencyAnalyzer.js';
export type { DependencyReport } from './analysis/DependencyAnalyzer.js';
export { LayerViolationAnalyzer, computeStats } from './analysis/LayerViolationAnalyzer.js';
export type { LayerViolationReport, GraphStats } from './analysis/LayerViolationAnalyzer.js';

export type { GraphExporter } from './exporters/GraphExporter.js';
export { JsonExporter } from './exporters/JsonExporter.js';
export { DotExporter, MermaidExporter } from './exporters/DotExporter.js';
export { GraphMLExporter } from './exporters/GraphMLExporter.js';
export { CytoscapeExporter, ReactFlowExporter, Neo4jExporter } from './exporters/CytoscapeExporter.js';

export { ProjectLoader } from './cli/ProjectLoader.js';
