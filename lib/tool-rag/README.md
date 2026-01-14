# Tool-RAG System

This directory implements a **Tool Retrieval-Augmented Generation (RAG)** system for selecting the most relevant tools per user query, reducing token costs and improving response latency.

## Architecture

```
User Query
    ↓
Tool Retriever (local keyword/semantic matching)
    ↓
Top-K Tool Selection (default: 12 tools)
    ↓
Gemini (receives only selected tool schemas)
    ↓
Tool Execution (MCP Server)
    ↓
Natural Answer
```

## Directory Structure

```
tool-rag/
├── types.ts              # TypeScript types for tool docs and selection
├── toolStore.ts          # Loads and caches SSOT tool catalog
├── retriever.ts          # Selects relevant tools per message
├── README.md             # This file
└── tools/                # SSOT tool catalog (one JSON per tool)
    ├── search_geospatial_metadata.json
    ├── get_transaction_count.json
    ├── get_total_sales_value.json
    └── ...
```

## Tool Document Schema

Each tool is defined by a JSON file in `tools/` with the following structure:

```json
{
  "name": "get_transaction_count",
  "category": "sales",
  "description": "Short description for Gemini",
  "whenToUse": [
    "Longer guidance on when to call this tool",
    "Examples: User asks about transaction count"
  ],
  "keywords": [
    "transactions",
    "count",
    "معاملات",
    "عدد"
  ],
  "examples": [
    {
      "user": "كم عدد المعاملات في جزيرة ياس في 2023؟",
      "notes": "First call search_geospatial_metadata, then this tool."
    }
  ],
  "gemini": {
    "parameters": {
      "type": "object",
      "properties": {
        "district": { "type": "string" },
        "year": { "type": "number" }
      },
      "required": ["district", "year"]
    }
  }
}
```

### Fields

- **name**: Unique tool identifier (must match MCP server handler)
- **category**: One of: `geo`, `sales`, `rental`, `supply`, `municipality`, `other`
- **description**: Short (1–2 sentences) description shown to Gemini
- **whenToUse**: Array of longer guidance strings (used for retrieval)
- **keywords**: Array of keywords in English + Arabic (improves matching)
- **examples**: Array of example user queries with optional notes
- **gemini.parameters**: JSON schema compatible with Gemini Function Calling API

## Usage

### Selecting Tools for a Message

```typescript
import { selectToolsForMessage } from '@/lib/tool-rag/retriever';

const result = selectToolsForMessage('كم عدد المعاملات في جزيرة ياس؟', {
  topK: 12,
  fallbackK: 20,
  alwaysInclude: ['search_geospatial_metadata'],
  debug: true,
});

console.log(result.selectedToolNames); // ['search_geospatial_metadata', 'get_transaction_count', ...]
```

### Loading All Tool Docs

```typescript
import { getAllToolDocs, getToolDocByName } from '@/lib/tool-rag/toolStore';

const tools = getAllToolDocs(); // Cached after first call
const searchTool = getToolDocByName('search_geospatial_metadata');
```

### Generating Gemini Tool Declarations

```typescript
import { getToolsForGemini } from '@/lib/mcp/toolRegistry';

// All tools
const allTools = getToolsForGemini();

// Filtered subset
const selectedTools = getToolsForGemini(['search_geospatial_metadata', 'get_transaction_count']);
```

## Configuration

Environment variables:

- `TOOL_RAG_TOP_K`: Number of top tools to select (default: `12`)
- `TOOL_RAG_FALLBACK_K`: Fallback limit when scores are low (default: `20`)
- `TOOL_RAG_DEBUG`: Set to `1` or `true` to enable debug logging

Example `.env.local`:

```env
TOOL_RAG_TOP_K=15
TOOL_RAG_FALLBACK_K=25
TOOL_RAG_DEBUG=1
```

## Retrieval Strategy

The current implementation uses a **hybrid local retrieval** approach:

1. **Tokenization**: Normalize text (lowercase, remove punctuation/diacritics)
2. **Keyword Matching**: Strong boost for exact keyword matches
3. **Token Overlap**: Lightweight BM25-like scoring
4. **Name Matching**: Boost if tool name appears in query
5. **Fail-Open**: If all scores are zero or uncertain, return broader set

### Future Enhancements

- Multilingual embeddings (e.g., Gemini embeddings API)
- Category pre-filtering (sales/rental/supply/geo)
- Query intent classification

## Testing

### Run Unit Tests

```bash
npm test -- lib/tool-rag/retriever.test.ts
```

### Interactive Tool Selection Testing

```bash
npx tsx scripts/test-tool-selection.ts
```

### Validate SSOT Catalog

```bash
npx tsx scripts/validate-tool-catalog.ts
```

## Adding a New Tool

1. **Implement server-side handler** in `mcp-server/src/index.ts`:

```typescript
{
  name: 'get_rental_index',
  description: 'Gets rental index for a district',
  inputSchema: { ... }
}
```

2. **Create SSOT JSON** in `lib/tool-rag/tools/get_rental_index.json`:

```json
{
  "name": "get_rental_index",
  "category": "rental",
  "description": "Gets rental price index",
  "keywords": ["rental", "index", "price", "إيجار", "مؤشر"],
  "examples": [
    { "user": "What is the rental index in Yas Island?" }
  ],
  "gemini": { "parameters": { ... } }
}
```

3. **Validate**:

```bash
npx tsx scripts/validate-tool-catalog.ts
```

4. **Test**:

```bash
npx tsx scripts/test-tool-selection.ts
```

The tool will automatically be included in the next build and available for Gemini to call.

## Troubleshooting

### Tool not selected for a query

- Add relevant **keywords** (Arabic + English)
- Add **examples** with actual user queries
- Check **whenToUse** guidance
- Enable `TOOL_RAG_DEBUG=1` to see scoring details

### Tool selected but shouldn't be

- Review **keywords** for false positives
- Adjust **description** to be more specific
- Check if query contains ambiguous terms

### Server and SSOT out of sync

```bash
npx tsx scripts/validate-tool-catalog.ts
```

This will show which tools exist in the server but not in SSOT (or vice versa).

## Design Principles

1. **Single Source of Truth**: Tool metadata lives in one place (`tools/*.json`)
2. **Fail-Open**: If retrieval is uncertain, include more tools rather than failing
3. **Multilingual**: Arabic and English treated equally in keyword matching
4. **Bounded Outputs**: Hard caps on tool count to prevent context bloat
5. **Deterministic Guardrails**: Critical tools (e.g., `search_geospatial_metadata`) always included
