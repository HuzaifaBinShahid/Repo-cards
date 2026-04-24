import * as path from 'path';
import type { FileNode } from '../types';

const CANDIDATE_EXT = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

export function buildImportGraph(files: Record<string, FileNode>): {
  importsIn: Record<string, string[]>;
  importsOut: Record<string, string[]>;
} {
  const allFiles = new Set(Object.keys(files));
  const importsIn: Record<string, string[]> = {};
  const importsOut: Record<string, string[]> = {};
  for (const key of Object.keys(files)) {
    importsIn[key] = [];
    importsOut[key] = [];
  }

  for (const file of Object.values(files)) {
    for (const imp of file.imports) {
      const resolved = resolveLocal(file.path, imp.source, allFiles);
      if (!resolved) continue;
      imp.resolved = resolved;
      importsOut[file.path].push(resolved);
      importsIn[resolved] = importsIn[resolved] ?? [];
      importsIn[resolved].push(file.path);
    }
  }

  for (const k of Object.keys(importsIn)) importsIn[k] = [...new Set(importsIn[k])];
  for (const k of Object.keys(importsOut)) importsOut[k] = [...new Set(importsOut[k])];

  return { importsIn, importsOut };
}

function resolveLocal(
  fromFile: string,
  spec: string,
  allFiles: Set<string>,
): string | undefined {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return undefined;
  const fromDir = path.posix.dirname(fromFile);
  const base = path.posix.normalize(path.posix.join(fromDir, spec));

  if (allFiles.has(base)) return base;

  const stripped = base.replace(/\.(js|mjs|cjs)$/, '');
  if (stripped !== base) {
    for (const ext of ['.ts', '.tsx', '.mts', '.cts']) {
      if (allFiles.has(stripped + ext)) return stripped + ext;
    }
  }

  for (const ext of CANDIDATE_EXT) {
    if (allFiles.has(base + ext)) return base + ext;
  }

  for (const ext of CANDIDATE_EXT) {
    const indexPath = path.posix.join(base, `index${ext}`);
    if (allFiles.has(indexPath)) return indexPath;
  }

  return undefined;
}
