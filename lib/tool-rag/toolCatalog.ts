/**
 * Tool Catalog - Single Source of Truth
 * 
 * All tool definitions in one TypeScript file (no file I/O, build-safe)
 */

import type { ToolDoc } from './types';

export const TOOL_CATALOG: ToolDoc[] = [
  {
    name: 'search_geospatial_metadata',
    category: 'geo',
    description: 'SEARCH FIRST. Finds exact district/project/community names and returns valid English names.',
    whenToUse: [
      'If the user mentions ANY location name (Arabic or English).',
      'Use before any district/project/community data query to avoid guessing names.',
      'Examples: Yas/جزيرة ياس, Reem/الريم, Saadiyat/السعديات',
    ],
    keywords: [
      'search', 'find', 'lookup', 'district', 'project', 'community', 'location',
      'اسم', 'بحث', 'ابحث', 'منطقة', 'جزيرة', 'مجتمع', 'مشروع',
    ],
    examples: [
      { user: 'كم عدد المعاملات في جزيرة ياس في 2023؟', notes: "First call search_geospatial_metadata(query='جزيرة ياس') to get 'YAS ISLAND'." },
      { user: 'Sales in Yas Island 2024', notes: 'First call search_geospatial_metadata(query=\'Yas Island\') to confirm exact name.' },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Name to search (e.g., 'Yas', 'جزيرة ياس')" },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_total_sales_value',
    category: 'sales',
    description: 'Gets total sales value for a district and year. Requires valid English district name.',
    whenToUse: [
      'User asks about total sales value/amount/قيمة المبيعات.',
      'User asks: إجمالي قيمة المبيعات في [مكان] لعام [سنة].',
    ],
    keywords: ['sales value', 'total sales', 'value', 'amount', 'revenue', 'قيمة', 'إجمالي', 'المبيعات'],
    examples: [
      { user: 'What was the total sales value in Yas Island in 2023?', notes: 'Search location first, then call get_total_sales_value(district, year).' },
      { user: 'ما هي إجمالي قيمة المبيعات في جزيرة ياس في 2023؟', notes: "Search 'جزيرة ياس' first to get 'YAS ISLAND'." },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          district: { type: 'string', description: "Valid English district name (e.g., 'YAS ISLAND')" },
          year: { type: 'number', description: 'Year (e.g., 2023)' },
          typology: { type: 'string', description: 'Optional property type filter', enum: ['Apartment', 'Villa', 'Townhouse', 'Plot'] },
          layout: { type: 'string', description: 'Optional bedroom count filter', enum: ['Studio', '1 bed', '2 beds', '3 beds', '4 beds', '5 beds', '6+ beds'] },
        },
        required: ['district', 'year'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_transaction_count',
    category: 'sales',
    description: 'Counts sales transactions for a district and year. Requires valid English district name.',
    whenToUse: [
      'User asks: how many transactions/كم عدد المعاملات.',
      'User asks about number of deals/sales contracts in a place for a year.',
    ],
    keywords: ['transactions', 'transaction count', 'how many', 'count', 'عدد', 'كم', 'معاملات', 'صفقات'],
    examples: [
      { user: 'كم عدد المعاملات في جزيرة ياس في العام 2023؟', notes: "Search 'جزيرة ياس' first, then call get_transaction_count(district='YAS ISLAND', year=2023)." },
      { user: 'How many transactions in Al Reem Island in 2024?', notes: "Search 'Al Reem' first to confirm exact district name." },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          district: { type: 'string', description: 'Valid English district name' },
          year: { type: 'number', description: 'Year' },
        },
        required: ['district', 'year'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'compare_sales_between_districts',
    category: 'sales',
    description: 'Compares sales between two districts (value/count depending on server implementation).',
    whenToUse: [
      'User asks to compare two districts: compare, vs, versus, قارن, مقارنة.',
      'User asks which district performed better in a given year.',
    ],
    keywords: ['compare', 'comparison', 'vs', 'versus', 'contrast', 'قارن', 'مقارنة', 'فرق'],
    examples: [
      { user: 'Compare sales between Saadiyat Island and Yas Island in 2024', notes: 'Search both names first if uncertain, then call compare_sales_between_districts(district1, district2, year).' },
      { user: 'قارن المبيعات بين جزيرة السعديات و جزيرة ياس في 2024', notes: 'Search both Arabic names to get exact English district names.' },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          district1: { type: 'string', description: 'First district name' },
          district2: { type: 'string', description: 'Second district name' },
          year: { type: 'number', description: 'Year' },
        },
        required: ['district1', 'district2'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'find_units_by_budget',
    category: 'rental',
    description: 'Finds rental units by budget and layout (bedrooms).',
    whenToUse: [
      'User asks about rentals, rent budget, or finding units within a price range.',
      'Arabic: إيجار, استئجار, ميزانية, ضمن',
    ],
    keywords: ['rent', 'rental', 'lease', 'budget', 'aed', 'إيجار', 'استئجار', 'ميزانية', 'سعر'],
    examples: [
      { user: 'Find me a 2-bedroom apartment to rent for 120,000 AED a year', notes: "Call find_units_by_budget(budget=120000, layout='2 beds')." },
      { user: 'ابحث عن شقة غرفتين للإيجار بميزانية 120000', notes: 'Call find_units_by_budget with budget and layout.' },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          budget: { type: 'number', description: 'Max budget AED' },
          layout: { type: 'string', description: 'Layout', enum: ['Studio', '1 bed', '2 beds', '3 beds', '4 beds', '5+ beds'] },
          year: { type: 'number', description: 'Optional year' },
        },
        required: ['budget', 'layout'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_current_supply',
    category: 'supply',
    description: 'Gets available housing supply (inventory) for a district and year.',
    whenToUse: [
      'User asks about supply, availability, inventory, units available.',
      'Arabic: العرض, المتاح, الوحدات المتاحة',
    ],
    keywords: ['supply', 'availability', 'inventory', 'units available', 'العرض', 'المتاح', 'وحدات', 'الوحدات المتاحة'],
    examples: [
      { user: 'What is the current housing supply in Khalifa City for 3-bedroom villas in 2024?', notes: 'Search location first, then call get_current_supply(district, year, layout).' },
      { user: 'كم عدد الوحدات المتاحة في خليفة سيتي في 2024؟', notes: "Search 'خليفة سيتي' first to get the exact English name." },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          district: { type: 'string', description: 'District name in English' },
          year: { type: 'number', description: 'Year' },
          layout: { type: 'string', description: 'Optional: Filter by bedroom count' },
        },
        required: ['district', 'year'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_municipality_sales',
    category: 'municipality',
    description: 'Gets total sales data for an entire municipality (aggregates all districts).',
    whenToUse: [
      'User asks about a municipality as a whole: Abu Dhabi City, Al Ain City, Al Dhafra Region.',
      'Arabic: أبو ظبي, العين, الظفرة',
    ],
    keywords: ['municipality', 'abu dhabi city', 'al ain', 'al dhafra', 'أبو ظبي', 'ابوظبي', 'العين', 'الظفرة', 'المنطقة الغربية'],
    examples: [
      { user: 'Show me the total sales in Abu Dhabi City in 2023', notes: "Call get_municipality_sales(municipality='Abu Dhabi City', year=2023)." },
      { user: 'ما هي إجمالي المبيعات في أبو ظبي في 2023؟', notes: "Call get_municipality_sales(municipality='Abu Dhabi City', year=2023)." },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          municipality: { type: 'string', description: 'Municipality name', enum: ['Abu Dhabi City', 'Al Ain City', 'Al Dhafra Region'] },
          year: { type: 'number', description: 'Optional year' },
        },
        required: ['municipality'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_top_districts_in_municipality',
    category: 'municipality',
    description: 'Returns top districts ranked by sales value within a municipality.',
    whenToUse: [
      'User asks about top/best districts within a municipality for a year.',
      'Arabic: أفضل المناطق, أعلى المبيعات, أكثر المناطق مبيعاً',
    ],
    keywords: ['top', 'best', 'rank', 'highest', 'أفضل', 'الأعلى', 'ترتيب', 'أكثر'],
    examples: [
      { user: 'Show me the top 5 districts by sales in Abu Dhabi City for 2023', notes: 'Call get_top_districts_in_municipality(municipality, year, limit=5).' },
      { user: 'اعرض أفضل 5 مناطق من حيث المبيعات في أبو ظبي لعام 2023', notes: "Call get_top_districts_in_municipality(municipality='Abu Dhabi City', year=2023, limit=5)." },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          municipality: { type: 'string', description: 'Municipality name', enum: ['Abu Dhabi City', 'Al Ain City', 'Al Dhafra Region'] },
          year: { type: 'number', description: 'Year' },
          limit: { type: 'number', description: 'Number of top districts to return (default 5)' },
        },
        required: ['municipality', 'year'],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_districts',
    category: 'geo',
    description: 'Lists all districts in Abu Dhabi.',
    whenToUse: [
      'User asks: list all districts / what districts exist.',
      'Arabic: ما هي المناطق؟ اعرض المناطق',
    ],
    keywords: ['list districts', 'districts', 'what districts', 'المناطق', 'اعرض', 'قائمة'],
    examples: [
      { user: 'What districts are there in Abu Dhabi?' },
      { user: 'ما هي المناطق الموجودة في أبو ظبي؟' },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    name: 'get_communities',
    category: 'geo',
    description: 'Lists communities within a district (or all communities if district not provided).',
    whenToUse: [
      'User asks about communities/neighborhoods inside a district.',
      'Arabic: المجتمعات, الأحياء',
    ],
    keywords: ['communities', 'community', 'neighborhoods', 'الأحياء', 'المجتمعات'],
    examples: [
      { user: 'List all the communities in Al Falah', notes: "Search location first if needed, then call get_communities(district='AL FALAH')." },
      { user: 'اعرض المجتمعات في الفلاح', notes: 'Search Arabic name first to get English district name.' },
    ],
    gemini: {
      parameters: {
        type: 'object',
        properties: {
          district: { type: 'string', description: 'District name in English (optional)' },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];
