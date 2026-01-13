/**
 * MCP Tool Registry for Gemini Tool Calling
 * 
 * This file defines all MCP tools in a format compatible with Gemini's function calling.
 * Each tool is exported with its schema for Gemini to understand what tools are available.
 */

import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

/**
 * All available MCP tools for real estate queries
 * These will be registered with Gemini for function calling
 */
export const MCP_TOOLS: FunctionDeclaration[] = [
  {
    name: 'get_total_sales_value',
    description: 'Get total sales value and transaction volume for a district in a specific year. Use this when user asks about total sales, sales value, sales amount, or revenue. Supports both English and Arabic district names (translate Arabic to English before calling).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'District name in English (e.g., "YAS ISLAND", "AL REEM ISLAND", "SAADIYAT ISLAND"). If user provides Arabic name, translate: جزيرة ياس → YAS ISLAND, جزيرة الريم → AL REEM ISLAND, جزيرة السعديات → SAADIYAT ISLAND'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year of transactions (e.g., 2024, 2023)'
        },
        typology: {
          type: SchemaType.STRING,
          description: 'Optional: Property type filter',
          format: 'enum' as const,
          enum: ['Apartment', 'Villa', 'Townhouse', 'Plot']
        },
        layout: {
          type: SchemaType.STRING,
          description: 'Optional: Bedroom count filter',
          format: 'enum' as const,
          enum: ['Studio', '1 bed', '2 beds', '3 beds', '4 beds', '5 beds', '6+ beds']
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'get_transaction_count',
    description: 'Get the number of real estate transactions in a district. Use when user asks about transaction count, number of deals, how many sales, volume of transactions. Arabic: عدد المعاملات, عدد الصفقات',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'District name in English (translate from Arabic if needed)'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year of transactions'
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'compare_sales_between_districts',
    description: 'Compare sales data between two districts. Use when user asks to compare, contrast, or see differences between two locations. Arabic: قارن, مقارنة',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district1: {
          type: SchemaType.STRING,
          description: 'First district name in English'
        },
        district2: {
          type: SchemaType.STRING,
          description: 'Second district name in English'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year for comparison (optional, defaults to latest available)'
        }
      },
      required: ['district1', 'district2']
    }
  },
  {
    name: 'find_units_by_budget',
    description: 'Find rental units within a specific budget and bedroom count. Use when user asks about rentals, rent, finding units, apartments for rent within budget. Arabic: إيجار, وحدات للإيجار',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        budget: {
          type: SchemaType.NUMBER,
          description: 'Maximum annual budget in AED (e.g., 100000 for 100k)'
        },
        layout: {
          type: SchemaType.STRING,
          description: 'Bedroom count',
          format: 'enum' as const,
          enum: ['Studio', '1 bed', '2 beds', '3 beds', '4 beds', '5+ beds']
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year (optional)'
        }
      },
      required: ['budget', 'layout']
    }
  },
  {
    name: 'get_current_supply',
    description: 'Get available housing supply (inventory) for a district. Use when user asks about supply, availability, units available, housing stock. Arabic: العرض, الوحدات المتاحة',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'District name in English'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year'
        },
        layout: {
          type: SchemaType.STRING,
          description: 'Optional: Filter by bedroom count'
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'get_municipality_sales',
    description: 'Get total sales data for an entire municipality (aggregates all districts). Use when user asks about Abu Dhabi City, Al Ain City, or Al Dhafra Region as a whole (not specific districts). Arabic: أبو ظبي → Abu Dhabi City, العين → Al Ain City',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        municipality: {
          type: SchemaType.STRING,
          description: 'Municipality name',
          format: 'enum' as const, enum: ['Abu Dhabi City', 'Al Ain City', 'Al Dhafra Region']
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year (optional)'
        }
      },
      required: ['municipality']
    }
  },
  {
    name: 'get_top_districts_in_municipality',
    description: 'Get top districts ranked by sales value within a municipality. Use when user asks about best districts, highest sales areas, top performing districts.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        municipality: {
          type: SchemaType.STRING,
          description: 'Municipality name',
          format: 'enum' as const, enum: ['Abu Dhabi City', 'Al Ain City', 'Al Dhafra Region']
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year'
        },
        limit: {
          type: SchemaType.NUMBER,
          description: 'Number of top districts to return (default 5)'
        }
      },
      required: ['municipality', 'year']
    }
  },
  {
    name: 'get_districts',
    description: 'Get complete list of all districts in Abu Dhabi. Use when user asks to list all districts, show available districts, what districts exist.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'get_communities',
    description: 'Get list of communities within a specific district. Use when user asks about communities, neighborhoods, sub-areas within a district.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'District name in English (optional, if not provided returns all communities)'
        }
      },
      required: []
    }
  }
];

/**
 * Get tools formatted for Gemini's function calling
 */
export function getToolsForGemini() {
  return MCP_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
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
