import fs from 'node:fs';
import path from 'node:path';
import type { ToolDoc } from './types';

let cachedTools: ToolDoc[] | null = null;

function toolsDir(): string {
  return path.join(process.cwd(), 'lib', 'tool-rag', 'tools');
}

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isToolDoc(value: any): value is ToolDoc {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.description === 'string' &&
    value.gemini &&
    typeof value.gemini === 'object' &&
    value.gemini.parameters &&
    typeof value.gemini.parameters === 'object'
  );
}

export function getAllToolDocs(): ToolDoc[] {
  if (cachedTools) return cachedTools;

  const dir = toolsDir();
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));

  const tools: ToolDoc[] = [];

  for (const fileName of files) {
    const filePath = path.join(dir, fileName);
    const parsed = readJson(filePath);

    if (!isToolDoc(parsed)) {
      throw new Error(`Invalid tool doc: ${fileName}`);
    }

    tools.push(parsed);
  }

  // Basic invariants
  const seen = new Set<string>();
  for (const tool of tools) {
    if (seen.has(tool.name)) {
      throw new Error(`Duplicate tool name in SSOT: ${tool.name}`);
    }
    seen.add(tool.name);
  }

  cachedTools = tools;
  return tools;
}

export function getToolDocByName(name: string): ToolDoc | undefined {
  return getAllToolDocs().find((t) => t.name === name);
}
