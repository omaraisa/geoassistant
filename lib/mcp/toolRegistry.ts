/**
 * MCP Tool Registry for Gemini Tool Calling
 * 
 * This file defines all MCP tools in a format compatible with Gemini's function calling.
 * Each tool is exported with its schema for Gemini to understand what tools are available.
 */

import type { FunctionDeclaration } from '@google/generative-ai';
import { SchemaType } from '@google/generative-ai';

import { getAllToolDocs } from '@/lib/tool-rag/toolStore';
import type { ToolGeminiParameterSchema } from '@/lib/tool-rag/types';

/**
 * All available MCP tools for real estate queries
 * These will be registered with Gemini for function calling
 */
function toGeminiSchema(schema: ToolGeminiParameterSchema): any {
  const mapType = (t: ToolGeminiParameterSchema['type']): SchemaType => {
    switch (t) {
      case 'object':
        return SchemaType.OBJECT;
      case 'string':
        return SchemaType.STRING;
      case 'number':
        return SchemaType.NUMBER;
      case 'boolean':
        return SchemaType.BOOLEAN;
      case 'array':
        return SchemaType.ARRAY;
      default:
        return SchemaType.STRING;
    }
  };

  const out: any = {
    type: mapType(schema.type),
  };

  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;

  if (schema.type === 'object') {
    out.properties = {};
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        out.properties[key] = toGeminiSchema(value);
      }
    }
    if (schema.required) out.required = schema.required;
  }

  if (schema.type === 'array' && schema.items) {
    out.items = toGeminiSchema(schema.items);
  }

  return out;
}

export let MCP_TOOLS: FunctionDeclaration[] | null = null;

function initializeTools(): FunctionDeclaration[] {
  if (!MCP_TOOLS) {
    MCP_TOOLS = getAllToolDocs().map((doc) => ({
      name: doc.name,
      description: doc.description,
      parameters: toGeminiSchema(doc.gemini.parameters),
    }));
  }
  return MCP_TOOLS;
}

/**
 * Get tools formatted for Gemini's function calling
 */
export function getToolsForGemini(toolNames?: string[]) {
  const tools = initializeTools();
  const set = toolNames && toolNames.length ? new Set(toolNames) : null;
  return tools
    .filter((tool) => (set ? set.has(tool.name) : true))
    .map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
}

/**
 * District name translations (Arabic → English)
 */
export const DISTRICT_TRANSLATIONS: Record<string, string> = {
  // Islands
  'جزيرة ياس': 'YAS ISLAND',
  'ياس': 'YAS ISLAND',
  'جزيرة الريم': 'AL REEM ISLAND',
  'الريم': 'AL REEM ISLAND',
  'جزيرة السعديات': 'SAADIYAT ISLAND',
  'السعديات': 'SAADIYAT ISLAND',
  
  // Municipalities
  'أبو ظبي': 'Abu Dhabi City',
  'ابوظبي': 'Abu Dhabi City',
  'العين': 'Al Ain City',
  'الظفرة': 'Al Dhafra Region',
  'المنطقة الغربية': 'Al Dhafra Region',
};

/**
 * Common query synonyms for tool matching
 */
export const QUERY_SYNONYMS = {
  transactions: ['transactions', 'deals', 'sales', 'contracts', 'معاملات', 'صفقات'],
  value: ['value', 'amount', 'revenue', 'total', 'قيمة', 'إجمالي'],
  count: ['count', 'number', 'how many', 'volume', 'عدد', 'كم'],
  compare: ['compare', 'comparison', 'vs', 'versus', 'contrast', 'قارن', 'مقارنة'],
  rent: ['rent', 'rental', 'lease', 'إيجار', 'استئجار'],
  supply: ['supply', 'availability', 'inventory', 'stock', 'العرض', 'المتاح'],
};
