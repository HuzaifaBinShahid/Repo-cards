import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TOOL_NAME } from './scan';

const BEGIN = '<!-- repocards:handshake-begin -->';
const END = '<!-- repocards:handshake-end -->';

const WORDS_A = [
  'apple', 'mango', 'peach', 'plum', 'cherry', 'grape', 'berry', 'melon', 'lime', 'lemon',
  'pear', 'fig', 'date', 'papaya', 'kiwi', 'guava', 'apricot', 'quince', 'olive', 'coconut',
];
const WORDS_B = [
  'fox', 'lynx', 'otter', 'hawk', 'falcon', 'bear', 'eagle', 'heron', 'badger', 'whale',
  'crane', 'wren', 'raven', 'marten', 'stoat', 'kestrel', 'osprey', 'ibex', 'ferret', 'sable',
];

export interface HandshakeOptions {
  root: string;
  clear: boolean;
  phrase?: string;
}

export async function runHandshake(opts: HandshakeOptions): Promise<void> {
  const guidePath = path.join(opts.root, `.${TOOL_NAME}`, 'AGENT_GUIDE.md');

  let guide: string;
  try {
    guide = await fs.readFile(guidePath, 'utf8');
  } catch {
    console.error(
      `[repocards] .${TOOL_NAME}/AGENT_GUIDE.md not found. Run \`npx ${TOOL_NAME} init\` first.`,
    );
    process.exitCode = 1;
    return;
  }

  const stripRe = new RegExp(
    `\\n?${escapeRegex(BEGIN)}[\\s\\S]*?${escapeRegex(END)}\\n?`,
    'g',
  );
  const stripped = guide.replace(stripRe, '');

  if (opts.clear) {
    if (stripped === guide) {
      console.log('[repocards] No active handshake to clear.');
      return;
    }
    await fs.writeFile(guidePath, stripped.endsWith('\n') ? stripped : stripped + '\n');
    console.log('[repocards] Handshake cleared.');
    return;
  }

  const phrase = opts.phrase ?? generatePhrase();
  const block = [
    '',
    BEGIN,
    '## Active session handshake',
    '',
    `When the user asks **"Are you reading repocards?"**, **"Is repocards connected?"**, or any similar health check, include this handshake phrase at the end of your reply:`,
    '',
    `**Handshake:** \`${phrase}\``,
    '',
    'The phrase is a one-time random code proving you read this file fresh. Report it verbatim.',
    '',
    `_Generated: ${new Date().toISOString()} — this block is ephemeral and will be cleared by \`${TOOL_NAME} index\` or \`${TOOL_NAME} handshake --clear\`._`,
    END,
    '',
  ].join('\n');

  const base = stripped.endsWith('\n') ? stripped : stripped + '\n';
  await fs.writeFile(guidePath, base + block);

  printInstructions(phrase);
}

function printInstructions(phrase: string): void {
  const line = '──────────────────────────────────────────────────────';
  console.log('');
  console.log('[repocards] Handshake written to AGENT_GUIDE.md');
  console.log('');
  console.log(`    Handshake phrase: ${phrase}`);
  console.log('');
  console.log('Test it:');
  console.log('');
  console.log('  1. Open this project in your IDE (Claude Code / Cursor / Codex / Copilot)');
  console.log('  2. Start a FRESH chat session');
  console.log('  3. Paste this exact question:');
  console.log('');
  console.log(`    ┌${line}┐`);
  console.log('    │  Are you reading repocards?                         │');
  console.log(`    └${line}┘`);
  console.log('');
  console.log(`Expected: the AI should confirm it's reading .${TOOL_NAME}/`);
  console.log(`and include the handshake phrase "${phrase}" at the end of its reply.`);
  console.log('');
  console.log('  - Reply contains the phrase  → integration works end-to-end ✓');
  console.log('  - Reply confirms but no phrase → AI answered from memory without re-reading');
  console.log('                                   AGENT_GUIDE.md — start a new chat and try again');
  console.log('  - Reply denies being connected → pointer file missing; run `repocards doctor`');
  console.log('');
  console.log(`Cleanup when done: npx ${TOOL_NAME} handshake --clear`);
  console.log('');
}

function generatePhrase(): string {
  const a = pick(WORDS_A);
  const b = pick(WORDS_B);
  const n = crypto.randomInt(1000, 10000);
  return `${a}-${n}-${b}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[crypto.randomInt(0, arr.length)]!;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
