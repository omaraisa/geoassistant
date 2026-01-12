/**
 * Natural Language Understanding for Real Estate Queries
 * Parses user questions and maps them to MCP tool calls
 */

export interface ParsedQuery {
  intent: string;
  entities: {
    district?: string;
    district1?: string;
    district2?: string;
    year?: number;
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
  'yas': 'YAS ISLAND',
  'yas island': 'YAS ISLAND',
  'al reem': 'AL REEM ISLAND',
  'reem': 'AL REEM ISLAND',
  'al reem island': 'AL REEM ISLAND',
  'saadiyat': 'SAADIYAT ISLAND',
  'saadiyat island': 'SAADIYAT ISLAND',
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
  
  // Extract year
  const yearMatch = lower.match(/\b(20\d{2}|202[0-9])\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
  
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
  
  // Extract district(s)
  const districts = extractDistricts(question);
  
  // Determine intent and tool
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
 * Extract district names from text
 */
function extractDistricts(text: string): string[] {
  const districts: string[] = [];
  const lower = text.toLowerCase();
  
  // Check for aliases
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    if (lower.includes(alias)) {
      if (!districts.includes(canonical)) {
        districts.push(canonical);
      }
    }
  }
  
  // If we found districts through aliases, return them
  if (districts.length > 0) {
    return districts;
  }
  
  // Otherwise, try to extract capitalized phrases
  const words = text.split(/\s+/);
  let currentDistrict = '';
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (/^[A-Z]/.test(word) && word.length > 2) {
      currentDistrict += (currentDistrict ? ' ' : '') + word.toUpperCase();
    } else if (currentDistrict) {
      districts.push(currentDistrict);
      currentDistrict = '';
    }
  }
  
  if (currentDistrict) {
    districts.push(currentDistrict);
  }
  
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
