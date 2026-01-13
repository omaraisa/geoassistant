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
    name: 'search_geospatial_metadata',
    description: 'SEARCH FIRST. Finds exact district/project names in the system. Required before querying data if the location name is uncertain or in Arabic.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Name to search (e.g., "Yas", "ياس")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_total_sales_value',
    description: 'Get total sales value. Requires valid English district name from search_geospatial_metadata.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'Valid English district name (e.g., "YAS ISLAND")'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year (e.g., 2024)'
        },
        typology: {
          type: SchemaType.STRING,
          description: 'Property type filter',
          format: 'enum' as const,
          enum: ['Apartment', 'Villa', 'Townhouse', 'Plot']
        },
        layout: {
          type: SchemaType.STRING,
          description: 'Bedroom count filter',
          format: 'enum' as const,
          enum: ['Studio', '1 bed', '2 beds', '3 beds', '4 beds', '5 beds', '6+ beds']
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'get_transaction_count',
    description: 'Get transaction count. Requires valid English district name from search_geospatial_metadata.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district: {
          type: SchemaType.STRING,
          description: 'Valid English district name'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year'
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'compare_sales_between_districts',
    description: 'Compare sales between two districts.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        district1: {
          type: SchemaType.STRING,
          description: 'First district Name'
        },
        district2: {
          type: SchemaType.STRING,
          description: 'Second district Name'
        },
        year: {
          type: SchemaType.NUMBER,
          description: 'Year'
        }
      },
      required: ['district1', 'district2']
    }
  },
  {
    name: 'find_units_by_budget',
    description: 'Find rentals by budget.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        budget: {
          type: SchemaType.NUMBER,
          description: 'Max budget AED'
        },
        layout: {
          type: SchemaType.STRING,
          description: 'Layout',
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
