import type { ToolDoc, ToolSelectionOptions, ToolSelectionResult } from './types';
import { getAllToolDocs } from './toolStore';

const DEFAULT_OPTIONS: ToolSelectionOptions = {
  topK: 12,
  fallbackK: 20,
  alwaysInclude: ['search_geospatial_metadata'],
  debug: false,
};

function normalizeText(input: string): string {
  // Lowercase + trim + remove some punctuation.
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // Arabic diacritics
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(input: string): string[] {
  const norm = normalizeText(input);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

function buildToolSearchText(tool: ToolDoc): string {
  const parts: string[] = [tool.name, tool.description];
  if (tool.whenToUse?.length) parts.push(tool.whenToUse.join(' '));
  if (tool.keywords?.length) parts.push(tool.keywords.join(' '));
  if (tool.examples?.length) parts.push(tool.examples.map((e) => e.user).join(' '));
  return normalizeText(parts.join(' '));
}

function scoreTool(messageTokens: string[], messageNorm: string, tool: ToolDoc): number {
  const toolText = buildToolSearchText(tool);
  if (!toolText) return 0;

  let score = 0;

  // Strong substring boosts for keywords
  if (tool.keywords?.length) {
    for (const kw of tool.keywords) {
      const kwNorm = normalizeText(kw);
      if (!kwNorm) continue;
      if (messageNorm.includes(kwNorm)) score += 5;
    }
  }

  // Token overlap (lightweight BM25-ish approximation)
  const toolTokenSet = new Set(tokenize(toolText));
  for (const token of messageTokens) {
    if (token.length < 2) continue;
    if (toolTokenSet.has(token)) score += 1;
  }

  // Small boost if the tool name appears
  if (messageNorm.includes(normalizeText(tool.name))) score += 3;

  return score;
}

export function selectToolsForMessage(
  message: string,
  options: Partial<ToolSelectionOptions> = {}
): ToolSelectionResult {
  const effective: ToolSelectionOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    const tools = getAllToolDocs();

    // Empty message -> safe fallback
    if (!message || !message.trim()) {
      return {
        selectedToolNames: tools.map((t) => t.name),
        debug: effective.debug ? { reason: 'fallback_all' } : undefined,
      };
    }

    const messageNorm = normalizeText(message);
    const messageTokens = tokenize(messageNorm);

    const scored = tools
      .map((tool) => ({ name: tool.name, score: scoreTool(messageTokens, messageNorm, tool) }))
      .sort((a, b) => b.score - a.score);

    const always = new Set(effective.alwaysInclude);

    // If everything scored 0, fail-open to keep the system usable.
    if (!scored.length || scored[0].score <= 0) {
      const selected = tools.map((t) => t.name);
      return {
        selectedToolNames: selected,
        debug: effective.debug ? { reason: 'fallback_all', scored } : undefined,
      };
    }

    const top = scored.filter((s) => s.score > 0).slice(0, effective.topK).map((s) => s.name);

    const merged = Array.from(new Set([...Array.from(always), ...top]));

    // Guardrail: if we selected too few, broaden.
    if (merged.length < Math.min(3, tools.length)) {
      const broader = scored
        .filter((s) => s.score > 0)
        .slice(0, effective.fallbackK)
        .map((s) => s.name);
      const broaderMerged = Array.from(new Set([...Array.from(always), ...broader]));
      return {
        selectedToolNames: broaderMerged,
        debug: effective.debug ? { reason: 'fallback_top', scored } : undefined,
      };
    }

    return {
      selectedToolNames: merged,
      debug: effective.debug ? { reason: 'ranked', scored } : undefined,
    };
  } catch {
    // Fail open.
    return { selectedToolNames: [], debug: effective.debug ? { reason: 'error' } : undefined };
  }
}
