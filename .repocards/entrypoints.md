# Entrypoints

Files where execution begins — servers, CLIs, library public API, scripts.

## `src/cli.ts`

**Reason:** no-incoming-imports · **Language:** ts · **LOC:** 96

**Imports 5 local files:**

- `src/commands/doctor.ts`
- `src/commands/handshake.ts`
- `src/commands/init.ts`
- `src/commands/scan.ts`
- `src/commands/skill.ts`

## `src/installer.ts`

**Reason:** no-incoming-imports · **Language:** ts · **LOC:** 26

**Imports 1 local file:**

- `src/commands/init.ts`

## CLI binaries (package.json:bin)

- `repocards` → `dist/cli.js`
- `repocards-installer` → `dist/installer.js`

## npm scripts

- `npm run build` → `tsc`
- `npm run dev` → `tsc --watch`
- `npm run start` → `node dist/cli.js`
- `npm run prepublishOnly` → `npm run build`
