/**
 * Natural Language Understanding for Real Estate Queries
 * Parses user questions and maps them to MCP tool calls
 */

export interface ParsedQuery {
  intent: string;
  entities: {
    municipality?: string;
    district?: string;
    district1?: string;
    district2?: string;
    year?: number;
    quarter?: number;
    budget?: number;
    layout?: string;
    typology?: string;
    project?: string;
    community?: string;
  };
  tool: string;
  confidence: number;
}

// Common district name variations
const DISTRICT_ALIASES: Record<string, string> = {
  // Islands
  'yas': 'YAS ISLAND',
  'yas island': 'YAS ISLAND',
  'al reem': 'AL REEM ISLAND',
  'reem': 'AL REEM ISLAND',
  'reem island': 'AL REEM ISLAND',
  'al reem island': 'AL REEM ISLAND',
  'saadiyat': 'SAADIYAT ISLAND',
  'saadiyat island': 'SAADIYAT ISLAND',
  'al saadiyat': 'SAADIYAT ISLAND',
};

// Municipality name mappings
const MUNICIPALITY_ALIASES: Record<string, string> = {
  'abu dhabi': 'Abu Dhabi City',
  'abudhabi': 'Abu Dhabi City',
  'abu dhabi city': 'Abu Dhabi City',
  'al ain': 'Al Ain City',
  'alain': 'Al Ain City',
  'al ain city': 'Al Ain City',
  'al dhafra': 'Al Dhafra Region',
  'dhafra': 'Al Dhafra Region',
  'western region': 'Al Dhafra Region',
};

// Layout patterns
const LAYOUT_PATTERNS = [
  { pattern: /(\d+)\s*bed(?:room)?s?/i, format: (n: string) => `${n} beds` },
  { pattern: /studio/i, format: () => 'Studio' },
];

/**
 * Parse natural language query into structured format
 */
export function parseQuery(question: string): ParsedQuery | null {
  const lower = question.toLowerCase();
  
  // Extract year and quarter
  const yearMatch = lower.match(/\b(20\d{2}|202[0-9])\b/);
  let year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  
  // Handle relative time periods
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);
  
  let quarter: number | undefined;
  
  if (lower.includes('last quarter')) {
    quarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
    year = year || (currentQuarter === 1 ? currentYear - 1 : currentYear);
  } else if (lower.includes('this quarter') || lower.includes('current quarter')) {
    quarter = currentQuarter;
    year = year || currentYear;
  } else {
    const quarterMatch = lower.match(/q(\d)/i);
    if (quarterMatch) {
      quarter = parseInt(quarterMatch[1]);
    }
  }
  
  // Extract budget
  const budgetMatch = lower.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|aed)?/i);
  let budget: number | undefined;
  if (budgetMatch) {
    const amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    budget = lower.includes('k') || lower.includes('thousand') ? amount * 1000 : amount;
  }
  
  // Extract layout
  let layout: string | undefined;
  for (const { pattern, format } of LAYOUT_PATTERNS) {
    const match = question.match(pattern);
    if (match) {
      layout = format(match[1]);
      break;
    }
  }
  
  // Extract municipality and districts
  const municipality = extractMunicipality(question);
  const districts = extractDistricts(question);
  
  // Determine intent and tool
  
  // Municipality-level sales query
  if ((lower.includes('total') || lower.includes('value') || lower.includes('sales')) && 
      municipality && !districts.length) {
    return {
      intent: 'municipality_sales',
      entities: {
        municipality,
        year,
        quarter,
      },
      tool: 'get_municipality_sales',
      confidence: 0.9,
    };
  }
  
  // Compare sales between districts
  if (lower.includes('compare') && lower.includes('sales') && districts.length >= 2) {
    return {
      intent: 'compare_sales',
      entities: {
        district1: districts[0],
        district2: districts[1],
        year,
      },
      tool: 'compare_sales_between_districts',
      confidence: 0.9,
    };
  }
  
  if ((lower.includes('total') || lower.includes('value')) && lower.includes('sales')) {
    return {
      intent: 'total_sales',
      entities: {
        district: districts[0],
        year,
        layout,
      },
      tool: 'get_total_sales_value',
      confidence: 0.85,
    };
  }
  
  if (lower.includes('transaction') && lower.includes('count')) {
    return {
      intent: 'transaction_count',
      entities: {
        district: districts[0],
        year: year || new Date().getFullYear(),
      },
      tool: 'get_transaction_count',
      confidence: 0.85,
    };
  }
  
  if ((lower.includes('transaction') || lower.includes('number of')) && 
      !lower.includes('count')) {
    return {
      intent: 'transaction_count',
      entities: {
        district: districts[0],
        year: year || new Date().getFullYear(),
      },
      tool: 'get_transaction_count',
      confidence: 0.8,
    };
  }
  
  if (((lower.includes('find') || lower.includes('search') || lower.includes('show')) && 
       (lower.includes('rental') || lower.includes('rent'))) || 
      (budget && layout && !lower.includes('supply'))) {
    return {
      intent: 'find_rentals',
      entities: {
        budget: budget || 100000,
        layout: layout || '3 beds',
        year,
      },
      tool: 'find_units_by_budget',
      confidence: 0.9,
    };
  }
  
  if ((lower.includes('supply') || lower.includes('available') || 
       (lower.includes('units') && !lower.includes('rental'))) &&
      !lower.includes('budget')) {
    return {
      intent: 'supply_info',
      entities: {
        district: districts[0],
        year: year || new Date().getFullYear(),
        layout,
      },
      tool: 'get_current_supply',
      confidence: 0.85,
    };
  }
  
  // Fallback: get districts if no specific query detected
  if (lower.includes('district') || lower.includes('area')) {
    return {
      intent: 'list_districts',
      entities: {},
      tool: 'get_districts',
      confidence: 0.7,
    };
  }
  
  return null;
}

/**
 * Extract municipality name from text
 */
function extractMunicipality(text: string): string | undefined {
  const lower = text.toLowerCase();
  
  // Check for municipality aliases
  for (const [alias, canonical] of Object.entries(MUNICIPALITY_ALIASES)) {
    if (lower.includes(alias)) {
      return canonical;
    }
  }
  
  return undefined;
}

/**
 * Extract district names from text
 */
function extractDistricts(text: string): string[] {
  const districts: string[] = [];
  const lower = text.toLowerCase();
  
  // Check for aliases first (most reliable)
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (lower.includes(alias)) {
      if (!districts.includes(canonical)) {
        districts.push(canonical);
      }
    }
  }
  
  // Return early if we found districts through aliases
  // Don't try to extract capitalized words if we already have matches
  return districts;
}

/**
 * Format parsed query for display
 */
export function formatParsedQuery(parsed: ParsedQuery): string {
  const parts = [`Intent: ${parsed.intent}`];
  
  if (Object.keys(parsed.entities).length > 0) {
    parts.push(`Entities: ${JSON.stringify(parsed.entities, null, 2)}`);
  }
  
  parts.push(`Tool: ${parsed.tool}`);
  parts.push(`Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
  
  return parts.join('\n');
}
