import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { TOOL_NAME } from './scan';

export interface SkillOptions {
  uninstall: boolean;
  claude: boolean;
  cursor: boolean;
}

interface SkillResult {
  target: string;
  action: 'installed' | 'updated' | 'unchanged' | 'removed' | 'not found' | 'skipped';
}

export async function runSkill(opts: SkillOptions): Promise<void> {
  const home = os.homedir();
  const results: SkillResult[] = [];

  if (opts.claude) {
    results.push(
      opts.uninstall ? await uninstallClaudeSkill(home) : await installClaudeSkill(home),
    );
  }
  if (opts.cursor) {
    results.push(
      opts.uninstall ? await uninstallCursorUserRule(home) : await installCursorUserRule(home),
    );
  }

  console.log('');
  for (const r of results) {
    console.log(`  ${r.action.padEnd(11)} ${r.target}`);
  }
  console.log('');

  if (opts.uninstall) {
    console.log('[repocards] Global skill integrations removed.');
    return;
  }

  const installedClaude = results.find((r) => r.target.includes('.claude'));
  const installedCursor = results.find((r) => r.target.includes('.cursor'));

  console.log('[repocards] Global skill integrations installed.');
  console.log('');
  console.log('What this gives you:');
  if (installedClaude) {
    console.log(`  Claude Code: every new chat auto-loads ~/.claude/skills/${TOOL_NAME}/SKILL.md,`);
    console.log('               so you can type `/repocards` to set up / refresh any repo.');
  }
  if (installedCursor) {
    console.log('  Cursor:      the user-level rule makes Cursor auto-detect `.repocards/` folders');
    console.log('               in any project you open — no per-project setup required.');
    console.log('');
    console.log(`               If Cursor does not pick it up at ~/.cursor/rules/, open`);
    console.log('               Cursor Settings → Rules for AI and paste in the contents of');
    console.log(`               ~/.cursor/rules/${TOOL_NAME}-autodetect.mdc manually.`);
  }
  console.log('');
  console.log(`Uninstall any time: npx ${TOOL_NAME} skill uninstall`);
}

async function installClaudeSkill(home: string): Promise<SkillResult> {
  const dir = path.join(home, '.claude', 'skills', TOOL_NAME);
  const file = path.join(dir, 'SKILL.md');
  const next = renderClaudeSkill();

  await fs.mkdir(dir, { recursive: true });
  let prev = '';
  try {
    prev = await fs.readFile(file, 'utf8');
  } catch {
    /* new install */
  }
  if (prev === next) {
    return { target: `~/.claude/skills/${TOOL_NAME}/SKILL.md`, action: 'unchanged' };
  }
  await fs.writeFile(file, next);
  return {
    target: `~/.claude/skills/${TOOL_NAME}/SKILL.md`,
    action: prev ? 'updated' : 'installed',
  };
}

async function uninstallClaudeSkill(home: string): Promise<SkillResult> {
  const dir = path.join(home, '.claude', 'skills', TOOL_NAME);
  try {
    await fs.stat(dir);
    await fs.rm(dir, { recursive: true, force: true });
    return { target: `~/.claude/skills/${TOOL_NAME}/`, action: 'removed' };
  } catch {
    return { target: `~/.claude/skills/${TOOL_NAME}/`, action: 'not found' };
  }
}

async function installCursorUserRule(home: string): Promise<SkillResult> {
  const dir = path.join(home, '.cursor', 'rules');
  const file = path.join(dir, `${TOOL_NAME}-autodetect.mdc`);
  const next = renderCursorUserRule();

  await fs.mkdir(dir, { recursive: true });
  let prev = '';
  try {
    prev = await fs.readFile(file, 'utf8');
  } catch {
    /* new install */
  }
  if (prev === next) {
    return { target: `~/.cursor/rules/${TOOL_NAME}-autodetect.mdc`, action: 'unchanged' };
  }
  await fs.writeFile(file, next);
  return {
    target: `~/.cursor/rules/${TOOL_NAME}-autodetect.mdc`,
    action: prev ? 'updated' : 'installed',
  };
}

async function uninstallCursorUserRule(home: string): Promise<SkillResult> {
  const file = path.join(home, '.cursor', 'rules', `${TOOL_NAME}-autodetect.mdc`);
  try {
    await fs.unlink(file);
    return { target: `~/.cursor/rules/${TOOL_NAME}-autodetect.mdc`, action: 'removed' };
  } catch {
    return { target: `~/.cursor/rules/${TOOL_NAME}-autodetect.mdc`, action: 'not found' };
  }
}

function renderClaudeSkill(): string {
  return `---
name: ${TOOL_NAME}
description: Set up or refresh ${TOOL_NAME} codebase context in the current repository
---

# ${TOOL_NAME}

${TOOL_NAME} generates a pre-computed codebase context folder (\`.${TOOL_NAME}/\`) that AI assistants read instead of greping the source. Typical cost: 10–50× fewer tokens per question.

## When this skill applies

The user is asking to set up, refresh, or check ${TOOL_NAME} in the current project.

## What to do

1. If the user says **install**, **init**, or **setup** → run \`npx ${TOOL_NAME} init\` in the project root (adds \`.${TOOL_NAME}/\` and wires Claude Code / Cursor / Codex / Copilot pointer files).
2. If the user says **refresh**, **update**, or **index** → run \`npx ${TOOL_NAME} index\`.
3. If the user says **check**, **doctor**, or **health** → run \`npx ${TOOL_NAME} doctor\`.
4. If the user says **test**, **verify**, or **handshake** → run \`npx ${TOOL_NAME} handshake\`.
5. If intent is unclear, default to \`npx ${TOOL_NAME} init\`.

## After running

- After \`init\`, open \`.${TOOL_NAME}/AGENT_GUIDE.md\` and briefly summarize what was indexed.
- After \`index\`, report the file / symbol counts so the user knows it refreshed.
- After \`handshake\`, tell the user the handshake phrase and the verification steps.

## Learn more

npm: https://www.npmjs.com/package/${TOOL_NAME}
`;
}

function renderCursorUserRule(): string {
  return `---
description: Auto-detect ${TOOL_NAME} context folders in any project opened in Cursor.
alwaysApply: true
---

# Global ${TOOL_NAME} auto-detection

If the current workspace contains a \`.${TOOL_NAME}/\` folder, **read \`.${TOOL_NAME}/AGENT_GUIDE.md\` at the start of the task**. That folder is a pre-computed, team-maintained summary of the repository generated by [${TOOL_NAME}](https://www.npmjs.com/package/${TOOL_NAME}).

Prefer reading the pre-computed cards (architecture.md, entrypoints.md, api-surface.md, modules/*.md) over running grep/find on the source code — typically 10–50× fewer tokens per question.

If the user asks "Are you reading ${TOOL_NAME}?" and the folder exists, confirm you are reading it.
`;
}
