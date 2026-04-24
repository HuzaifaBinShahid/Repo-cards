import fg from 'fast-glob';
import ignore from 'ignore';
import { promises as fs } from 'fs';
import * as path from 'path';
import type { DiscoveredFile, Lang } from './types';

const LANG_BY_EXT: Record<string, Lang> = {
  '.ts': 'ts',
  '.mts': 'ts',
  '.cts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'jsx',
  '.md': 'md',
  '.mdx': 'md',
};

const BASE_IGNORES = [
  'node_modules',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.turbo',
  '.cache',
  '.parcel-cache',
  'coverage',
  '.git',
  '.svelte-kit',
  '*.min.js',
  '*.min.css',
  '*.d.ts',
  // our own agent-pointer files — noise when re-indexing
  'CLAUDE.md',
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.cursor',
];

export async function discoverFiles(
  root: string,
  toolName: string,
): Promise<DiscoveredFile[]> {
  const ig = ignore();
  ig.add(BASE_IGNORES);
  ig.add(`.${toolName}`);

  for (const candidate of ['.gitignore', `.${toolName}ignore`]) {
    try {
      const content = await fs.readFile(path.join(root, candidate), 'utf8');
      ig.add(content);
    } catch {
      // file may not exist; ignore
    }
  }

  const all = await fg(
    ['**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs,md,mdx}'],
    {
      cwd: root,
      dot: false,
      followSymbolicLinks: false,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
    },
  );

  const kept: DiscoveredFile[] = [];
  for (const rel of all) {
    const posix = rel.replace(/\\/g, '/');
    if (ig.ignores(posix)) continue;
    const ext = path.extname(posix).toLowerCase();
    const lang = LANG_BY_EXT[ext];
    if (!lang) continue;
    kept.push({
      path: posix,
      abs: path.join(root, rel),
      lang,
    });
  }
  return kept;
}
