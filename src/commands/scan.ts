import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import { discoverFiles } from '../discover';
import { deriveViews } from '../graph/derive';
import { buildImportGraph } from '../graph/resolve-imports';
import { extractTypescript } from '../parse/extractors/typescript';
import { writeOutput } from '../render/write';
import type { FileNode, IndexResult } from '../types';

export const TOOL_NAME = 'repocards';

export async function runIndex({ root }: { root: string }): Promise<IndexResult> {
  const start = Date.now();
  const files = await discoverFiles(root, TOOL_NAME);

  const fileNodes: Record<string, FileNode> = {};
  let totalSymbols = 0;
  let totalImports = 0;

  for (const f of files) {
    try {
      const source = await fs.readFile(f.abs, 'utf8');
      const hash = crypto.createHash('sha256').update(source).digest('hex');

      if (f.lang === 'md') {
        const title = source.match(/^#\s+(.+)$/m)?.[1]?.trim();
        const firstPara = source
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .find((p) => p.length > 0 && !p.startsWith('#') && !p.startsWith('<!--'));
        fileNodes[f.path] = {
          path: f.path,
          lang: 'md',
          loc: source.split('\n').length,
          hash,
          symbols: [],
          imports: [],
          title,
          summary: firstPara?.slice(0, 400),
        };
        continue;
      }

      const node = await extractTypescript(f, source, hash);
      fileNodes[f.path] = node;
      totalSymbols += node.symbols.length;
      totalImports += node.imports.length;
    } catch (err) {
      console.warn(
        `[repocards] failed to parse ${f.path}: ${(err as Error).message}`,
      );
    }
  }

  const { importsIn, importsOut } = buildImportGraph(fileNodes);
  const graph = { files: fileNodes, importsIn, importsOut };
  const views = await deriveViews(graph, root);

  const result: IndexResult = {
    root,
    name: TOOL_NAME,
    graph,
    views,
    stats: {
      files: Object.keys(fileNodes).length,
      symbols: totalSymbols,
      imports: totalImports,
      durationMs: Date.now() - start,
    },
  };

  const outDir = await writeOutput(result);

  console.log(
    `[repocards] Indexed ${result.stats.files} files · ${result.stats.symbols} symbols · ${result.stats.imports} imports in ${result.stats.durationMs}ms.`,
  );
  console.log(`[repocards] Wrote ${outDir}`);
  return result;
}
