import type { IndexResult } from '../types';

export function renderArchitecture(r: IndexResult): string {
  const { graph, views, stats } = r;

  const dirCounts: Record<string, { count: number; loc: number; isDir: boolean }> = {};
  for (const f of Object.values(graph.files)) {
    const parts = f.path.split('/');
    const [label, isDir] = parts.length === 1 ? ['(root)', false] : [parts[0], true];
    const bucket =
      dirCounts[label] ?? (dirCounts[label] = { count: 0, loc: 0, isDir: isDir as boolean });
    bucket.count += 1;
    bucket.loc += f.loc;
  }
  const sortedDirs = Object.entries(dirCounts).sort((a, b) => b[1].count - a[1].count);

  const lines: string[] = [];
  lines.push('# Architecture');
  lines.push('');
  if (views.packageMeta?.name) {
    const ver = views.packageMeta.version ? ` v${views.packageMeta.version}` : '';
    lines.push(`**Package:** \`${views.packageMeta.name}\`${ver}`);
    lines.push('');
  }
  lines.push(
    `**Stats:** ${stats.files} files · ${stats.symbols} symbols · ${stats.imports} imports.`,
  );
  lines.push('');

  lines.push('## Top-level layout');
  lines.push('');
  lines.push('| Directory | Files | LOC |');
  lines.push('|---|---:|---:|');
  for (const [label, c] of sortedDirs.slice(0, 20)) {
    const display = c.isDir ? `\`${label}/\`` : `\`${label}\``;
    lines.push(`| ${display} | ${c.count} | ${c.loc} |`);
  }
  lines.push('');

  if (views.hubs.length > 0) {
    lines.push('## Hub files (most-connected)');
    lines.push('');
    lines.push('These files sit at the center of the import graph. Changes here tend to ripple widely.');
    lines.push('');
    lines.push('| File | Imported by | Imports | Total |');
    lines.push('|---|---:|---:|---:|');
    for (const h of views.hubs.slice(0, 10)) {
      lines.push(`| [\`${h.file}\`](../${h.file}) | ${h.importedBy} | ${h.imports} | ${h.degree} |`);
    }
    lines.push('');
  }

  if (views.entrypoints.length > 0) {
    lines.push('## Entrypoints (summary)');
    lines.push('');
    for (const e of views.entrypoints.slice(0, 10)) {
      lines.push(`- [\`${e.file}\`](../${e.file}) — ${e.reason}`);
    }
    lines.push('');
    lines.push('_See [entrypoints.md](./entrypoints.md) for full detail._');
    lines.push('');
  }

  const docs = Object.values(graph.files).filter((f) => f.lang === 'md' && f.title);
  if (docs.length > 0) {
    lines.push('## Documentation index');
    lines.push('');
    for (const d of docs.slice(0, 15)) {
      const summary = d.summary ? ` — ${d.summary.replace(/\s+/g, ' ').slice(0, 140)}` : '';
      lines.push(`- [\`${d.path}\`](../${d.path}) — **${d.title}**${summary}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
