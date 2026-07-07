import type { AnalysisConfig } from '../config/AnalysisConfig.js';
import { EdgeFactory } from './EdgeFactory.js';
import { Graph } from './Graph.js';
import { NodeFactory } from './NodeFactory.js';
import { ASTWalker } from '../parser/ASTWalker.js';
import { ProgramFactory } from '../parser/ProgramFactory.js';
import { ModuleResolver, PathResolver } from '../resolver/ModuleResolver.js';
import { SymbolResolver } from '../resolver/SymbolResolver.js';
import { TypeResolver } from '../resolver/TypeResolver.js';
import { CallVisitor } from '../parser/visitors/CallVisitor.js';
import { ClassVisitor } from '../parser/visitors/ClassVisitor.js';
import { DecoratorVisitor } from '../parser/visitors/DecoratorVisitor.js';
import { EnumVisitor } from '../parser/visitors/EnumVisitor.js';
import { ExportVisitor } from '../parser/visitors/ExportVisitor.js';
import { FunctionVisitor } from '../parser/visitors/FunctionVisitor.js';
import { HeritageVisitor } from '../parser/visitors/HeritageVisitor.js';
import { ImportVisitor } from '../parser/visitors/ImportVisitor.js';
import { InterfaceVisitor } from '../parser/visitors/InterfaceVisitor.js';
import { MethodVisitor } from '../parser/visitors/MethodVisitor.js';
import { TypeReferenceVisitor } from '../parser/visitors/TypeReferenceVisitor.js';
import { VariableVisitor } from '../parser/visitors/VariableVisitor.js';
import type { GraphBuildContext } from '../parser/visitors/context.js';
import { toPosixPath } from '../utils/path.js';

/** Orchestrates the full graph construction pipeline. */
export class GraphBuilder {
  private readonly programFactory = new ProgramFactory();
  private readonly nodeFactory = new NodeFactory();
  private readonly edgeFactory = new EdgeFactory();

  build(config: AnalysisConfig): Graph {
    const programResult = this.programFactory.create(config);
    const graph = new Graph();

    const projectNode = this.nodeFactory.project(
      toPosixPath(programResult.projectRoot).split('/').pop() ?? 'project',
      toPosixPath(programResult.projectRoot),
    );
    graph.addNode(projectNode);

    const pathResolver = new PathResolver(programResult.projectRoot);
    const moduleResolver = new ModuleResolver();
    const symbolResolver = new SymbolResolver(programResult.checker);
    const typeResolver = new TypeResolver(programResult.checker);

    const ctx: GraphBuildContext = {
      graph,
      nodeFactory: this.nodeFactory,
      edgeFactory: this.edgeFactory,
      symbolResolver,
      typeResolver,
      moduleResolver,
      pathResolver,
      projectRoot: programResult.projectRoot,
      symbolNodeMap: new Map(),
      fileNodeMap: new Map(),
    };

    const visitors = [
      new ImportVisitor(ctx),
      new ExportVisitor(ctx),
      new ClassVisitor(ctx),
      new InterfaceVisitor(ctx),
      new EnumVisitor(ctx),
      new FunctionVisitor(ctx),
      new MethodVisitor(ctx),
      new VariableVisitor(ctx),
      new CallVisitor(ctx),
      new DecoratorVisitor(ctx),
      new TypeReferenceVisitor(ctx),
      new HeritageVisitor(ctx),
    ];

    const walker = new ASTWalker(visitors);
    walker.walk(programResult.sourceFiles, {
      checker: programResult.checker,
      program: programResult.program,
      projectRoot: programResult.projectRoot,
    });

    return graph;
  }
}
