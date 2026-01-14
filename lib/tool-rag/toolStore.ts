import type { ToolDoc } from './types';
import { TOOL_CATALOG } from './toolCatalog';

export function getAllToolDocs(): ToolDoc[] {
  return TOOL_CATALOG;
}

export function getToolDocByName(name: string): ToolDoc | undefined {
  return TOOL_CATALOG.find((t) => t.name === name);
}
