import type { IndexResult } from '../types';

export function renderEntrypoints(r: IndexResult): string {
  const { graph, views } = r;
  const lines: string[] = [];
  lines.push('# Entrypoints');
  lines.push('');
  lines.push('Files where execution begins — servers, CLIs, library public API, scripts.');
  lines.push('');

  if (views.entrypoints.length === 0) {
    lines.push('_No entrypoints detected._');
    lines.push('');
  } else {
    for (const e of views.entrypoints) {
      const f = graph.files[e.file];
      if (!f) continue;
      lines.push(`## \`${e.file}\``);
      lines.push('');
      lines.push(`**Reason:** ${e.reason} · **Language:** ${f.lang} · **LOC:** ${f.loc}`);
      lines.push('');

      const exports = f.symbols.filter((s) => s.exported);
      if (exports.length > 0) {
        lines.push('**Exports:**');
        lines.push('');
        for (const s of exports.slice(0, 25)) {
          lines.push(
            `- \`${s.kind}\` **${s.name}** — [\`${s.file}:${s.line}\`](../${s.file}#L${s.line})`,
          );
        }
        if (exports.length > 25) {
          lines.push(`- … and ${exports.length - 25} more`);
        }
        lines.push('');
      }

      const outgoing = graph.importsOut[e.file] ?? [];
      if (outgoing.length > 0) {
        const noun = outgoing.length === 1 ? 'file' : 'files';
        lines.push(`**Imports ${outgoing.length} local ${noun}:**`);
        lines.push('');
        for (const i of outgoing.slice(0, 15)) lines.push(`- \`${i}\``);
        if (outgoing.length > 15) lines.push(`- … and ${outgoing.length - 15} more`);
        lines.push('');
      }
    }
  }

  if (views.packageMeta?.bin && Object.keys(views.packageMeta.bin).length > 0) {
    lines.push('## CLI binaries (package.json:bin)');
    lines.push('');
    for (const [name, target] of Object.entries(views.packageMeta.bin)) {
      lines.push(`- \`${name}\` → \`${target}\``);
    }
    lines.push('');
  }

  if (views.packageMeta?.scripts && Object.keys(views.packageMeta.scripts).length > 0) {
    lines.push('## npm scripts');
    lines.push('');
    for (const [name, cmd] of Object.entries(views.packageMeta.scripts)) {
      lines.push(`- \`npm run ${name}\` → \`${cmd}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}
