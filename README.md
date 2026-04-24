# repocards

**Markdown-first codebase context for AI coding assistants.**

Install once, every session reads a folder of pre-computed answers instead of greping the repo.

```bash
npx repocards init      # generates .repocards/ + wires into Claude Code / Cursor / Codex / Copilot
npx repocards index     # re-index after code changes
```

## What it does

`repocards init` walks your repo, parses it with tree-sitter, and emits a `.repocards/` folder containing small, navigable markdown files:

```
.repocards/
├── AGENT_GUIDE.md      tells any AI how to use this folder
├── architecture.md     one page: layers, entrypoints, hubs
├── entrypoints.md      main / bin / server boots / CLI commands
├── graph.json          structured graph for power queries
└── index.json          symbol → file:line map
```

It then adds a short pointer to `CLAUDE.md`, `.cursor/rules/repocards.mdc`, `AGENTS.md`, and `.github/copilot-instructions.md` so every new AI session reads the cards automatically — no per-prompt reminder needed.

## Commands

```bash
repocards init          # first-time setup for a project (also: `repocards install`)
repocards index         # refresh after code changes
repocards doctor        # check all integrations are healthy
repocards handshake     # live test: prove the AI is actually reading .repocards/
repocards skill install # install global Claude Code skill + Cursor user-level rule
```

Test the integration any time:

```bash
npx repocards handshake
# then in Claude Code / Cursor: "Are you reading repocards?"
# the AI should return the handshake phrase
```

## Global skill install

After running `repocards skill install` once, you get:

- **Claude Code**: type `/repocards` in any session to set up or refresh the current project
- **Cursor**: a user-level rule that auto-detects `.repocards/` folders in every project you open

```bash
npx repocards skill install
```

## Why not Graphify?

[Graphify](https://github.com/safishamsi/graphify) ships a `graph.json` and expects the AI to query it via MCP or hook. repocards' primary output is a folder of markdown files the AI reads directly — no query tool, no API, no LLM during indexing, no cost.

| | Graphify | repocards |
|---|---|---|
| Primary artifact | `graph.json` | Folder of `.md` cards |
| Indexing cost | Claude subagents | $0 — fully offline |
| Stack | Python + NetworkX + whisper | Node + tree-sitter |
| Install | `uv tool install graphifyy` | `npx repocards init` |
| Scope | Multimodal (video, images, PDFs) | Code + markdown docs |

## License

MIT
