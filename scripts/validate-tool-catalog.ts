#!/usr/bin/env node
/**
 * Validation script: ensures MCP server tools match Tool-RAG SSOT catalog
 * 
 * Run: npx tsx scripts/validate-tool-catalog.ts
 */

import { getAllToolDocs } from '../lib/tool-rag/toolStore';
import { readFileSync } from 'fs';
import { join } from 'path';

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    ssotToolCount: number;
    serverToolCount: number;
    matchedTools: number;
    missingFromServer: string[];
    missingFromSSOT: string[];
  };
};

function extractServerToolNames(): string[] {
  const serverIndexPath = join(process.cwd(), 'mcp-server', 'src', 'index.ts');
  const content = readFileSync(serverIndexPath, 'utf-8');

  // Extract tool names from server.setRequestHandler(ListToolsRequestSchema, ...)
  // Look for patterns like: name: 'tool_name'
  const toolNamePattern = /name:\s*['"]([a-z_]+)['"]/g;
  const matches = [...content.matchAll(toolNamePattern)];

  const names = new Set<string>();
  for (const match of matches) {
    const name = match[1];
    if (name && name !== 'test_connection') {
      names.add(name);
    }
  }

  return Array.from(names).sort();
}

function validate(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let ssotTools: ReturnType<typeof getAllToolDocs>;
  try {
    ssotTools = getAllToolDocs();
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Failed to load SSOT tool catalog: ${err.message}`],
      warnings: [],
      summary: {
        ssotToolCount: 0,
        serverToolCount: 0,
        matchedTools: 0,
        missingFromServer: [],
        missingFromSSOT: [],
      },
    };
  }

  let serverToolNames: string[];
  try {
    serverToolNames = extractServerToolNames();
  } catch (err: any) {
    return {
      valid: false,
      errors: [`Failed to extract server tool names: ${err.message}`],
      warnings: [],
      summary: {
        ssotToolCount: ssotTools.length,
        serverToolCount: 0,
        matchedTools: 0,
        missingFromServer: [],
        missingFromSSOT: [],
      },
    };
  }

  const ssotNames = new Set(ssotTools.map((t) => t.name));
  const serverNames = new Set(serverToolNames);

  const missingFromServer = Array.from(ssotNames).filter((name) => !serverNames.has(name));
  const missingFromSSOT = Array.from(serverNames).filter((name) => !ssotNames.has(name));
  const matched = Array.from(ssotNames).filter((name) => serverNames.has(name));

  if (missingFromServer.length > 0) {
    errors.push(
      `Tools in SSOT but NOT in MCP server: ${missingFromServer.join(', ')}`
    );
  }

  if (missingFromSSOT.length > 0) {
    warnings.push(
      `Tools in MCP server but NOT in SSOT: ${missingFromSSOT.join(', ')}`
    );
  }

  // Validate each tool doc structure
  for (const tool of ssotTools) {
    if (!tool.name || typeof tool.name !== 'string') {
      errors.push(`Tool missing valid 'name': ${JSON.stringify(tool)}`);
    }
    if (!tool.category || typeof tool.category !== 'string') {
      errors.push(`Tool '${tool.name}' missing valid 'category'`);
    }
    if (!tool.description || typeof tool.description !== 'string') {
      errors.push(`Tool '${tool.name}' missing valid 'description'`);
    }
    if (!tool.gemini || !tool.gemini.parameters) {
      errors.push(`Tool '${tool.name}' missing 'gemini.parameters' schema`);
    }

    // Recommendations
    if (!tool.keywords || tool.keywords.length === 0) {
      warnings.push(`Tool '${tool.name}' has no keywords (improves retrieval)`);
    }
    if (!tool.examples || tool.examples.length === 0) {
      warnings.push(`Tool '${tool.name}' has no examples (improves retrieval)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      ssotToolCount: ssotTools.length,
      serverToolCount: serverToolNames.length,
      matchedTools: matched.length,
      missingFromServer,
      missingFromSSOT,
    },
  };
}

function main() {
  console.log('🔍 Validating Tool-RAG SSOT catalog...\n');

  const result = validate();

  console.log('📊 Summary:');
  console.log(`  - SSOT tools:   ${result.summary.ssotToolCount}`);
  console.log(`  - Server tools: ${result.summary.serverToolCount}`);
  console.log(`  - Matched:      ${result.summary.matchedTools}`);

  if (result.summary.missingFromServer.length > 0) {
    console.log(`  - Missing from server: ${result.summary.missingFromServer.length}`);
  }
  if (result.summary.missingFromSSOT.length > 0) {
    console.log(`  - Missing from SSOT:   ${result.summary.missingFromSSOT.length}`);
  }

  console.log();

  if (result.errors.length > 0) {
    console.error('❌ Validation Errors:');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    console.log();
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    for (const warn of result.warnings) {
      console.warn(`  - ${warn}`);
    }
    console.log();
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All checks passed! Tool catalog is valid.');
    process.exit(0);
  } else if (result.valid) {
    console.log('✅ Validation passed (with warnings).');
    process.exit(0);
  } else {
    console.error('❌ Validation failed. Please fix errors above.');
    process.exit(1);
  }
}

main();
