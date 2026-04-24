import { promises as fs } from 'fs';
import * as path from 'path';
import type { IndexResult } from '../types';
import { renderAgentGuide } from './agent-guide';
import { renderArchitecture } from './architecture';
import { renderEntrypoints } from './entrypoints';

export async function writeOutput(result: IndexResult): Promise<string> {
  const outDir = path.join(result.root, `.${result.name}`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(path.join(outDir, '.cache'), { recursive: true });

  const agentGuide = renderAgentGuide({
    toolName: result.name,
    projectName: result.views.packageMeta?.name,
    fileCount: result.stats.files,
    symbolCount: result.stats.symbols,
    indexedAt: new Date().toISOString(),
  });
  await fs.writeFile(path.join(outDir, 'AGENT_GUIDE.md'), agentGuide);
  await fs.writeFile(path.join(outDir, 'architecture.md'), renderArchitecture(result));
  await fs.writeFile(path.join(outDir, 'entrypoints.md'), renderEntrypoints(result));

  const graphJson = {
    version: 1,
    generated_at: new Date().toISOString(),
    stats: result.stats,
    files: result.graph.files,
    imports_in: result.graph.importsIn,
    imports_out: result.graph.importsOut,
    entrypoints: result.views.entrypoints,
    hubs: result.views.hubs,
  };
  await fs.writeFile(path.join(outDir, 'graph.json'), JSON.stringify(graphJson, null, 2));

  const symbolIndex: Record<
    string,
    { file: string; line: number; kind: string; exported: boolean }[]
  > = Object.create(null);
  for (const f of Object.values(result.graph.files)) {
    for (const s of f.symbols) {
      let bucket = symbolIndex[s.name];
      if (!Array.isArray(bucket)) {
        bucket = [];
        symbolIndex[s.name] = bucket;
      }
      bucket.push({
        file: s.file,
        line: s.line,
        kind: s.kind,
        exported: s.exported,
      });
    }
  }
  await fs.writeFile(path.join(outDir, 'index.json'), JSON.stringify(symbolIndex, null, 2));

  const hashes: Record<string, { hash: string; loc: number }> = {};
  for (const f of Object.values(result.graph.files)) {
    hashes[f.path] = { hash: f.hash, loc: f.loc };
  }
  await fs.writeFile(
    path.join(outDir, '.cache', 'hashes.json'),
    JSON.stringify(hashes, null, 2),
  );

  return outDir;
}
