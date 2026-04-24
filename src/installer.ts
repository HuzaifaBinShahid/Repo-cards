#!/usr/bin/env node
import { runInit } from './commands/init';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const rootIndex = argv.findIndex((a) => a === '--root' || a === '-r');
  const root =
    rootIndex >= 0 && argv[rootIndex + 1] ? argv[rootIndex + 1]! : process.cwd();

  await runInit({
    root,
    integrations: {
      claude: !argv.includes('--no-claude'),
      cursor: !argv.includes('--no-cursor'),
      codex: !argv.includes('--no-codex'),
      copilot: !argv.includes('--no-copilot'),
    },
  });
}

main().catch((err) => {
  console.error(`[repocards-installer] ${(err as Error).message}`);
  if (process.env.DEBUG) console.error((err as Error).stack);
  process.exit(1);
});
