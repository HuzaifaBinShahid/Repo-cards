import { promises as fs } from 'fs';
import * as path from 'path';
import type { DerivedViews, Graph, PackageMeta } from '../types';

const TEST_PATH_RE = /(^|\/)(tests?|__tests__)\//;
const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/;

export async function deriveViews(graph: Graph, root: string): Promise<DerivedViews> {
  const packageMeta = await readPackageJson(root);
  const entrypoints: DerivedViews['entrypoints'] = [];
  const seen = new Set<string>();
  const mark = (file: string, reason: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    entrypoints.push({ file, reason });
  };

  const resolveManifestPath = (raw: string): string | undefined => {
    const clean = raw.replace(/^\.\//, '');
    const candidates = [clean];
    if (/\.js$/.test(clean)) {
      candidates.push(clean.replace(/\.js$/, '.ts'), clean.replace(/\.js$/, '.tsx'));
    }
    for (const c of candidates) {
      if (graph.files[c]) return c;
    }
    return undefined;
  };

  if (packageMeta?.main) {
    const m = resolveManifestPath(packageMeta.main);
    if (m) mark(m, 'package.json:main');
  }
  if (packageMeta?.bin) {
    for (const [name, target] of Object.entries(packageMeta.bin)) {
      const m = resolveManifestPath(target);
      if (m) mark(m, `package.json:bin.${name}`);
    }
  }

  for (const file of Object.keys(graph.files)) {
    if (seen.has(file)) continue;
    if (TEST_FILE_RE.test(file) || TEST_PATH_RE.test(file)) continue;
    if (graph.files[file].lang === 'md') continue;
    const incoming = graph.importsIn[file] ?? [];
    const outgoing = graph.importsOut[file] ?? [];
    if (incoming.length === 0 && outgoing.length > 0) {
      mark(file, 'no-incoming-imports');
    }
  }

  const hubs = Object.keys(graph.files)
    .filter((f) => graph.files[f].lang !== 'md')
    .map((f) => ({
      file: f,
      importedBy: graph.importsIn[f]?.length ?? 0,
      imports: graph.importsOut[f]?.length ?? 0,
      degree:
        (graph.importsIn[f]?.length ?? 0) + (graph.importsOut[f]?.length ?? 0),
    }))
    .filter((h) => h.degree > 0)
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 15);

  return { entrypoints, hubs, packageMeta };
}

async function readPackageJson(root: string): Promise<PackageMeta | undefined> {
  try {
    const content = await fs.readFile(path.join(root, 'package.json'), 'utf8');
    const pkg = JSON.parse(content);
    let bin: Record<string, string> | undefined;
    if (pkg.bin && typeof pkg.bin === 'object') bin = pkg.bin;
    else if (typeof pkg.bin === 'string' && pkg.name) bin = { [pkg.name]: pkg.bin };
    return {
      name: pkg.name,
      version: pkg.version,
      main: pkg.main,
      bin,
      scripts: pkg.scripts,
    };
  } catch {
    return undefined;
  }
}
