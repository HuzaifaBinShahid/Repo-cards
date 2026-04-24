# Architecture

**Package:** `repocards` v0.1.0

**Stats:** 23 files · 80 symbols · 68 imports.

## Top-level layout

| Directory | Files | LOC |
|---|---:|---:|
| `src/` | 22 | 1626 |
| `(root)` | 1 | 71 |

## Hub files (most-connected)

These files sit at the center of the import graph. Changes here tend to ripple widely.

| File | Imported by | Imports | Total |
|---|---:|---:|---:|
| [`src/commands/scan.ts`](../src/commands/scan.ts) | 5 | 6 | 11 |
| [`src/types.ts`](../src/types.ts) | 9 | 0 | 9 |
| [`src/commands/init.ts`](../src/commands/init.ts) | 2 | 5 | 7 |
| [`src/cli.ts`](../src/cli.ts) | 0 | 5 | 5 |
| [`src/render/write.ts`](../src/render/write.ts) | 1 | 4 | 5 |
| [`src/integrations/common.ts`](../src/integrations/common.ts) | 5 | 0 | 5 |
| [`src/commands/doctor.ts`](../src/commands/doctor.ts) | 1 | 3 | 4 |
| [`src/discover.ts`](../src/discover.ts) | 2 | 1 | 3 |
| [`src/parse/extractors/typescript.ts`](../src/parse/extractors/typescript.ts) | 1 | 2 | 3 |
| [`src/commands/handshake.ts`](../src/commands/handshake.ts) | 1 | 1 | 2 |

## Entrypoints (summary)

- [`src/cli.ts`](../src/cli.ts) — no-incoming-imports
- [`src/installer.ts`](../src/installer.ts) — no-incoming-imports

_See [entrypoints.md](./entrypoints.md) for full detail._

## Documentation index

- [`README.md`](../README.md) — **repocards** — **Markdown-first codebase context for AI coding assistants.**
