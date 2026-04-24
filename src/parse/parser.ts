import Parser from 'web-tree-sitter';
import type { Lang } from '../types';

let initialized = false;
const languages: Record<string, Parser.Language> = {};
const parsers: Record<string, Parser> = {};

function wasmNameFor(lang: Lang): string {
  if (lang === 'tsx') return 'tree-sitter-tsx';
  if (lang === 'ts') return 'tree-sitter-typescript';
  return 'tree-sitter-javascript';
}

function resolveWasm(wasmName: string): string {
  return require.resolve(`tree-sitter-wasms/out/${wasmName}.wasm`);
}

export async function getParser(lang: Lang): Promise<Parser> {
  if (!initialized) {
    await Parser.init();
    initialized = true;
  }
  const wasmName = wasmNameFor(lang);
  if (!languages[wasmName]) {
    languages[wasmName] = await Parser.Language.load(resolveWasm(wasmName));
  }
  if (!parsers[wasmName]) {
    const p = new Parser();
    p.setLanguage(languages[wasmName]);
    parsers[wasmName] = p;
  }
  return parsers[wasmName];
}
