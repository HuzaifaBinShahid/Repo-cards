import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { discoverFiles } from '../discover';
import { beginTag, endTag } from '../integrations/common';
import { TOOL_NAME } from './scan';

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

export async function runDoctor({ root }: { root: string }): Promise<void> {
  console.log(`\n[repocards] Checking installation in ${root}\n`);

  const folderChecks = await runFolderChecks(root);
  for (const c of folderChecks) printCheck(c);

  console.log('');
  console.log('  IDE integrations:');
  const integrationChecks = await runIntegrationChecks(root);
  for (const c of integrationChecks) printCheck(c, '    ');

  console.log('');
  const freshness = await runFreshnessCheck(root);
  printCheck(freshness);

  const allChecks = [...folderChecks, ...integrationChecks, freshness];
  const failed = allChecks.filter((c) => !c.ok);

  console.log('');
  if (failed.length === 0) {
    console.log('[repocards] All checks passed.');
    console.log(`[repocards] For a live test (is the AI actually reading the cards?) run: npx ${TOOL_NAME} handshake`);
  } else {
    console.log(`[repocards] ${failed.length} check(s) failed.`);
    console.log(`[repocards] Run \`npx ${TOOL_NAME} init\` to repair missing pieces.`);
    process.exitCode = 1;
  }
}

async function runFolderChecks(root: string): Promise<Check[]> {
  const ctxDir = path.join(root, `.${TOOL_NAME}`);
  const checks: Check[] = [];

  try {
    await fs.stat(ctxDir);
    checks.push({ name: `.${TOOL_NAME}/ folder exists`, ok: true });
  } catch {
    checks.push({
      name: `.${TOOL_NAME}/ folder exists`,
      ok: false,
      detail: `missing — run \`npx ${TOOL_NAME} init\``,
    });
    return checks;
  }

  for (const f of ['AGENT_GUIDE.md', 'architecture.md', 'entrypoints.md']) {
    try {
      const stat = await fs.stat(path.join(ctxDir, f));
      checks.push({
        name: `.${TOOL_NAME}/${f}`,
        ok: stat.size > 0,
        detail: `${stat.size} bytes`,
      });
    } catch {
      checks.push({ name: `.${TOOL_NAME}/${f}`, ok: false, detail: 'missing' });
    }
  }

  try {
    const raw = await fs.readFile(path.join(ctxDir, 'graph.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const fileCount = Object.keys(parsed.files ?? {}).length;
    checks.push({
      name: `.${TOOL_NAME}/graph.json`,
      ok: fileCount > 0,
      detail: `${fileCount} files indexed`,
    });
  } catch (err) {
    checks.push({
      name: `.${TOOL_NAME}/graph.json`,
      ok: false,
      detail: `invalid: ${(err as Error).message}`,
    });
  }

  return checks;
}

async function runIntegrationChecks(root: string): Promise<Check[]> {
  return [
    await checkBlockedFile('Claude Code', path.join(root, 'CLAUDE.md')),
    await checkCursor(root),
    await checkBlockedFile('Codex', path.join(root, 'AGENTS.md')),
    await checkBlockedFile('Copilot', path.join(root, '.github', 'copilot-instructions.md')),
  ];
}

async function checkBlockedFile(label: string, filePath: string): Promise<Check> {
  const rel = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const hasBegin = content.includes(beginTag(TOOL_NAME));
    const hasEnd = content.includes(endTag(TOOL_NAME));
    return {
      name: `${label.padEnd(12)}  ${rel}`,
      ok: hasBegin && hasEnd,
      detail: hasBegin && hasEnd ? 'repocards block present' : 'repocards block missing',
    };
  } catch {
    return {
      name: `${label.padEnd(12)}  ${rel}`,
      ok: false,
      detail: `file not found — run \`npx ${TOOL_NAME} init\``,
    };
  }
}

async function checkCursor(root: string): Promise<Check> {
  const rel = `.cursor/rules/${TOOL_NAME}.mdc`;
  const filePath = path.join(root, '.cursor', 'rules', `${TOOL_NAME}.mdc`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const hasAlways = /alwaysApply:\s*true/m.test(content);
    return {
      name: `${'Cursor'.padEnd(12)}  ${rel}`,
      ok: hasAlways,
      detail: hasAlways ? 'alwaysApply: true' : 'missing `alwaysApply: true`',
    };
  } catch {
    return {
      name: `${'Cursor'.padEnd(12)}  ${rel}`,
      ok: false,
      detail: 'file not found',
    };
  }
}

async function runFreshnessCheck(root: string): Promise<Check> {
  const cachePath = path.join(root, `.${TOOL_NAME}`, '.cache', 'hashes.json');
  let cache: Record<string, { hash: string }> = {};
  try {
    cache = JSON.parse(await fs.readFile(cachePath, 'utf8'));
  } catch {
    return {
      name: 'Cache freshness',
      ok: false,
      detail: `no cache — run \`npx ${TOOL_NAME} index\``,
    };
  }

  const files = await discoverFiles(root, TOOL_NAME);
  let changed = 0;
  let added = 0;
  const currentPaths = new Set<string>();

  for (const f of files) {
    currentPaths.add(f.path);
    try {
      const raw = await fs.readFile(f.abs);
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const cached = cache[f.path];
      if (!cached) added += 1;
      else if (cached.hash !== hash) changed += 1;
    } catch {
      // skip unreadable
    }
  }

  let removed = 0;
  for (const p of Object.keys(cache)) if (!currentPaths.has(p)) removed += 1;

  const total = changed + added + removed;
  if (total === 0) {
    return { name: 'Cache freshness', ok: true, detail: 'all files up-to-date' };
  }
  const parts: string[] = [];
  if (changed) parts.push(`${changed} changed`);
  if (added) parts.push(`${added} new`);
  if (removed) parts.push(`${removed} removed`);
  return {
    name: 'Cache freshness',
    ok: false,
    detail: `${parts.join(', ')} — run \`npx ${TOOL_NAME} index\``,
  };
}

function printCheck(c: Check, indent = '  '): void {
  const icon = c.ok ? '✓' : '✗';
  const detail = c.detail ? ` — ${c.detail}` : '';
  console.log(`${indent}${icon}  ${c.name}${detail}`);
}
