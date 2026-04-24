#!/usr/bin/env node
import { Command } from 'commander';
import { runDoctor } from './commands/doctor';
import { runHandshake } from './commands/handshake';
import { runInit } from './commands/init';
import { runIndex } from './commands/scan';
import { runSkill } from './commands/skill';

const program = new Command();

program
  .name('repocards')
  .description('Markdown-first codebase context for AI coding assistants')
  .version('0.1.0');

program
  .command('init')
  .alias('install')
  .description('Generate .repocards/ and wire pointers into CLAUDE.md / Cursor / AGENTS.md / Copilot')
  .option('-r, --root <path>', 'project root', process.cwd())
  .option('--no-claude', 'skip Claude Code integration')
  .option('--no-cursor', 'skip Cursor integration')
  .option('--no-codex', 'skip Codex / AGENTS.md integration')
  .option('--no-copilot', 'skip GitHub Copilot integration')
  .action(async (opts) => {
    await runInit({
      root: opts.root,
      integrations: {
        claude: opts.claude !== false,
        cursor: opts.cursor !== false,
        codex: opts.codex !== false,
        copilot: opts.copilot !== false,
      },
    });
  });

const skill = program
  .command('skill')
  .description('Manage global skill integrations (Claude Code skill + Cursor user-level rule)');

skill
  .command('install')
  .description('Install ~/.claude/skills/repocards/ and ~/.cursor/rules/repocards-autodetect.mdc')
  .option('--no-claude', 'skip Claude Code skill')
  .option('--no-cursor', 'skip Cursor user-level rule')
  .action(async (opts) => {
    await runSkill({
      uninstall: false,
      claude: opts.claude !== false,
      cursor: opts.cursor !== false,
    });
  });

skill
  .command('uninstall')
  .description('Remove the Claude Code skill and Cursor user-level rule')
  .action(async () => {
    await runSkill({ uninstall: true, claude: true, cursor: true });
  });

program
  .command('index')
  .description('Re-scan the repo and regenerate .repocards/')
  .option('-r, --root <path>', 'project root', process.cwd())
  .action(async (opts) => {
    await runIndex({ root: opts.root });
  });

program
  .command('doctor')
  .description('Check that .repocards/ and every IDE pointer file are healthy')
  .option('-r, --root <path>', 'project root', process.cwd())
  .action(async (opts) => {
    await runDoctor({ root: opts.root });
  });

program
  .command('handshake')
  .description('Live test: write a one-shot random phrase into AGENT_GUIDE.md; ask the AI "Are you reading repocards?" and confirm the phrase comes back')
  .option('-r, --root <path>', 'project root', process.cwd())
  .option('--clear', 'remove the handshake block from AGENT_GUIDE.md')
  .option('--phrase <phrase>', 'use a specific phrase instead of a random one')
  .action(async (opts) => {
    await runHandshake({
      root: opts.root,
      clear: opts.clear === true,
      phrase: opts.phrase,
    });
  });

program.parseAsync().catch((err) => {
  console.error(`[repocards] ${(err as Error).message}`);
  if (process.env.DEBUG) console.error((err as Error).stack);
  process.exit(1);
});
