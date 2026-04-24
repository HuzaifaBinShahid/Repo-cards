import { promises as fs } from 'fs';
import * as path from 'path';

export type UpsertStatus = 'created' | 'updated' | 'unchanged';

export const beginTag = (name: string): string => `<!-- ${name}:begin -->`;
export const endTag = (name: string): string => `<!-- ${name}:end -->`;

export async function upsertBlock(
  filePath: string,
  toolName: string,
  blockBody: string,
): Promise<UpsertStatus> {
  const block = `${beginTag(toolName)}\n${blockBody.trim()}\n${endTag(toolName)}\n`;

  let existing = '';
  try {
    existing = await fs.readFile(filePath, 'utf8');
  } catch {
    existing = '';
  }

  const re = new RegExp(
    `${escapeRegex(beginTag(toolName))}[\\s\\S]*?${escapeRegex(endTag(toolName))}\\n?`,
    'g',
  );

  if (re.test(existing)) {
    const next = existing.replace(re, block);
    if (next === existing) return 'unchanged';
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, next);
    return 'updated';
  }

  const sep = existing.length > 0 && !existing.endsWith('\n\n')
    ? existing.endsWith('\n')
      ? '\n'
      : '\n\n'
    : '';
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, existing + sep + block);
  return existing.length === 0 ? 'created' : 'updated';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
