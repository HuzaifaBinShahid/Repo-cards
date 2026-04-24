export type Lang = 'ts' | 'tsx' | 'js' | 'jsx' | 'md';

export type SymbolKind =
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'const'
  | 'enum';

export interface CkSymbol {
  id: string;
  name: string;
  kind: SymbolKind;
  file: string;
  line: number;
  col: number;
  exported: boolean;
  doc?: string;
}

export interface ImportEdge {
  from: string;
  source: string;
  resolved?: string;
  names: string[];
  line: number;
}

export interface FileNode {
  path: string;
  lang: Lang;
  loc: number;
  hash: string;
  symbols: CkSymbol[];
  imports: ImportEdge[];
  title?: string;
  summary?: string;
}

export interface Graph {
  files: Record<string, FileNode>;
  importsIn: Record<string, string[]>;
  importsOut: Record<string, string[]>;
}

export interface PackageMeta {
  name?: string;
  version?: string;
  main?: string;
  bin?: Record<string, string>;
  scripts?: Record<string, string>;
}

export interface DerivedViews {
  entrypoints: { file: string; reason: string }[];
  hubs: { file: string; degree: number; importedBy: number; imports: number }[];
  packageMeta?: PackageMeta;
}

export interface IndexResult {
  root: string;
  name: string;
  graph: Graph;
  views: DerivedViews;
  stats: {
    files: number;
    symbols: number;
    imports: number;
    durationMs: number;
  };
}

export interface DiscoveredFile {
  path: string;
  abs: string;
  lang: Lang;
}
