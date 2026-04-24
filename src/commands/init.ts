import { installClaudeCode } from '../integrations/claude-code';
import { installCodex } from '../integrations/codex';
import { installCopilot } from '../integrations/copilot';
import { installCursor } from '../integrations/cursor';
import { runIndex, TOOL_NAME } from './scan';

export interface InitOptions {
  root: string;
  integrations: {
    claude: boolean;
    cursor: boolean;
    codex: boolean;
    copilot: boolean;
  };
}

export async function runInit(opts: InitOptions): Promise<void> {
  console.log(`[repocards] Initializing in ${opts.root}…`);
  await runIndex({ root: opts.root });

  const results: { file: string; status: string }[] = [];
  if (opts.integrations.claude) results.push(await installClaudeCode(opts.root, TOOL_NAME));
  if (opts.integrations.cursor) results.push(await installCursor(opts.root, TOOL_NAME));
  if (opts.integrations.codex) results.push(await installCodex(opts.root, TOOL_NAME));
  if (opts.integrations.copilot) results.push(await installCopilot(opts.root, TOOL_NAME));

  console.log('\n[repocards] Agent pointers:');
  for (const r of results) {
    console.log(`  ${r.status.padEnd(10)}  ${r.file}`);
  }
  console.log(
    '\n[repocards] Done. New AI sessions will auto-load the pointer files and read `.repocards/AGENT_GUIDE.md`.',
  );
}
