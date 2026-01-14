# Real Estate Smart Assistant - System Architecture

## Overview

The Real Estate Smart Assistant is an AI-powered system that provides natural language access to Abu Dhabi real estate data through a conversational interface. The system combines Google's Gemini AI with the Model Context Protocol (MCP) to enable efficient, multi-turn conversations about real estate analytics.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Gemini AI     │    │   MCP Server    │
│                 │    │  (Tool Calling) │    │                 │
│ • Chat UI       │◄──►│ • Function      │◄──►│ • ArcGIS REST   │
│ • API Routes    │    │   Calling       │    │   API Client    │
│ • React Frontend│    │ • Multi-turn    │    │ • Data Queries  │
└─────────────────┘    │   Conversations │    └─────────────────┘
                       └─────────────────┘             │
                                                      ▼
                                               ┌─────────────────┐
                                               │   ArcGIS        │
                                               │   MapServer     │
                                               │   (Real Data)   │
                                               └─────────────────┘
```

## Tool-RAG Expansion Architecture (Scaling to 100+ Tools)

When the number of available tools grows, sending *all* tool schemas to the model on every user request increases token usage and latency. To scale safely, add a **Tool Router** that selects a small subset of tools per request.

```
┌─────────────────┐
│   Next.js App   │
│  /api/chat      │
└───────┬─────────┘
  │ user message
  ▼
┌──────────────────────────────────────────────────────┐
│ Tool Router (Tool-RAG)                               │
│  • Language-agnostic retrieval (Arabic/English/...)   │
│  • Select Top-K tools (e.g., 8–15)                    │
│  • Always include critical tools (e.g., metadata)     │
└───────┬──────────────────────────────────────────────┘
  │ selected tool schemas only
  ▼
┌─────────────────┐    tool calls     ┌─────────────────┐
│   Gemini AI     │◄─────────────────►│   MCP Client    │
│ (Tool Calling)  │                   │ (stdio)         │
└───────┬─────────┘                   └───────┬─────────┘
  │ tool outputs                          │
  ▼                                       ▼
┌─────────────────┐                       ┌─────────────────┐
│ Natural Answer  │                       │   MCP Server    │
│ (Arabic/English)│                       │  ArcGIS queries │
└─────────────────┘                       └─────────────────┘
```

## Data Flow

### 1. User Interaction
Users interact with the system through a web-based chat interface built with Next.js and React. The interface sends user messages to the `/api/chat` endpoint.

### 2. API Processing
The Next.js API route receives the message and forwards it to the Gemini AI service with access to MCP-defined tools.

### 3. AI Reasoning with Tools
Gemini analyzes the user query and determines which MCP tools to invoke. The system supports multi-turn conversations where Gemini can make multiple tool calls in sequence.

### 4. Tool Execution
The MCP client connects to the local MCP server via stdio (standard input/output) communication. Tool calls are executed against the ArcGIS REST API.

### 5. Data Retrieval
The MCP server queries real estate data from ArcGIS MapServer layers, including:
- Sales transactions
- Rental data
- Housing supply
- Geographic metadata

### 6. Response Generation
Gemini synthesizes the tool results into natural language responses, supporting both English and Arabic queries.

## Core Components

### Frontend (Next.js)
- **Location**: `app/`
- **Purpose**: Web interface for user interaction
- **Key Files**:
  - `app/page.tsx` - Main chat interface
  - `app/api/chat/route.ts` - API endpoint for chat requests
  - `components/chat/Sidebar.tsx` - Chat UI components

### AI Layer (Gemini)
- **Location**: `lib/gemini/`
- **Purpose**: Natural language processing and tool orchestration
- **Key Files**:
  - `toolCalling.ts` - Multi-turn tool calling implementation
- **Features**:
  - Function calling for tool invocation
  - Multi-turn conversation support (up to 5 tool loops)
  - Arabic language support

### MCP Integration
- **Location**: `lib/mcp/`
- **Purpose**: Protocol for AI-to-data communication
- **Key Files**:
  - `mcpClient.ts` - Client for connecting to MCP server
  - `toolRegistry.ts` - Tool definitions for Gemini
- **Protocol**: Uses stdio for secure, local communication

### MCP Server
- **Location**: `mcp-server/`
- **Purpose**: Data access layer for real estate queries
- **Key Files**:
  - `src/index.ts` - Main server implementation
  - `src/dataLoader.ts` - ArcGIS API client
  - `src/queries/` - Query implementations
  - `src/discovery/` - Metadata search tools

## Available Tools

The system provides 10 specialized MCP tools:

### Geospatial Tools
- `search_geospatial_metadata` - Find correct district/project names
- `get_districts` - List all districts in Abu Dhabi
- `get_communities` - List communities within a district

### Sales Analytics
- `get_total_sales_value` - Calculate total sales value by district/year
- `get_transaction_count` - Count transactions by district/year
- `compare_sales_between_districts` - Compare sales between districts
- `get_municipality_sales` - Get municipality-wide sales data
- `get_top_districts_in_municipality` - Rank districts by sales performance

### Rental & Supply
- `find_units_by_budget` - Search rental units by budget and bedrooms
- `get_current_supply` - Get housing supply by district and property type

## Data Sources

The system integrates with ArcGIS MapServer providing real estate data across multiple layers:

- **Sales Data**: Transaction records, sale values, property types
- **Rental Data**: Available rentals, pricing, bedroom counts
- **Supply Data**: Current inventory, property availability
- **Geographic Data**: Districts, communities, municipalities
- **Time Series**: Historical data from 2020-2024

## Key Features

### Multi-turn Conversations
The system supports complex queries requiring multiple steps:
1. Search for location metadata
2. Query specific data using validated names
3. Generate comprehensive responses

### Multilingual Support
- Handles Arabic and English queries
- Returns responses in the user's language
- Uses English names internally for data consistency

### Token Efficiency
- Tool/function schemas **do** count as model input tokens and use context window.
- MCP helps by standardizing tool integration and keeping business logic/data access outside the model.
- The biggest cost driver is typically: **(tool schemas + conversation history + tool results)**.
- Tool-RAG reduces cost/latency by sending only a small, relevant subset of tool schemas per request.

### Error Handling
- Graceful degradation for failed queries
- Validation of location names before data queries
- Comprehensive logging for debugging

## Development

### Prerequisites
- Node.js 18+
- Google Generative AI API key
- ArcGIS MapServer access

### Installation
```bash
npm install
cd mcp-server && npm install
```

### Running the System
```bash
# Start the Next.js development server
npm run dev

# Build the MCP server
cd mcp-server && npm run build
```

### Environment Variables
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## API Usage

### Chat Endpoint
```http
POST /api/chat
Content-Type: application/json

{
  "message": "How many transactions were there in Yas Island in 2023?"
}
```

### Response Format
```json
{
  "response": "There were 1,247 transactions in Yas Island during 2023."
}
```

## Architecture Benefits

1. **Scalable**: MCP allows easy addition of new data sources and tools
2. **Efficient**: Direct tool calls reduce token consumption
3. **Maintainable**: Clear separation between AI reasoning and data access
4. **Extensible**: New tools can be added without modifying core AI logic
5. **Secure**: Local MCP server communication doesn't expose data externally

## Future Enhancements

- Additional data sources (market trends, demographics)
- Advanced analytics (forecasting, comparisons)
- Voice interface integration
- Mobile application support
- Multi-language expansion beyond Arabic/English</content>

## Tool-RAG System (Ultimate Implementation Plan)

This section is an actionable plan for implementing a scalable Tool-RAG storage + retrieval layer, migrating tool definitions into a single source of truth, and wiring it into the existing Gemini + MCP flow.

### Goals

- Support **100+ tools** while keeping the *active* tool set per request small (target: **8–15 tools**).
- Work across languages (Arabic/English/others) without hardcoding synonyms for every tool.
- Make tools maintainable: one place to edit name/description/parameters/examples.
- Preserve current behavior: multi-turn tool execution, discovery-first workflow, MCP execution.

### Non-goals

- Replacing MCP or moving ArcGIS querying into the model.
- Building a full “autonomous agent” framework (planning/memory). This is scoped to tool selection + tool metadata storage.

### Design Principles

- **Single Source of Truth (SSOT)** for tool metadata.
- **Bounded outputs** (tool lists, results summaries) to avoid context bloat.
- **Deterministic guardrails** (always include `search_geospatial_metadata`).
- **Fail open**: if retrieval confidence is low, include a broader subset rather than failing.

---

## Phase 0 — Baseline Audit (1–2 hours)

**Deliverable:** inventory of current tools and their usage.

1. List all tool names exposed in:
   - `lib/mcp/toolRegistry.ts` (Gemini tool schemas)
   - `mcp-server/src/index.ts` (server-side tool handlers)
2. Confirm the “critical always-on tools” set (initially: `search_geospatial_metadata`).
3. Define the max active tool count (recommended defaults):
   - `TOOL_RAG_TOP_K=12`
   - `TOOL_RAG_FALLBACK_K=20`

---

## Phase 1 — Tool Metadata SSOT (1 day)

**Deliverable:** a new tool metadata store containing full descriptions + examples.

### 1.1 Create tool metadata files

Create a folder:

- `lib/tool-rag/tools/`

Store one JSON file per tool (stable ID = tool name):

- `lib/tool-rag/tools/get_transaction_count.json`

Recommended schema (example):

```json
{
  "name": "get_transaction_count",
  "category": "sales",
  "description": "Counts transactions for a district and year. Requires valid English district name.",
  "whenToUse": [
    "User asks: how many transactions/معاملات",
    "User asks transaction count for a district/year"
  ],
  "inputs": {
    "district": "Valid English district name from search_geospatial_metadata",
    "year": "Number year (e.g., 2023)"
  },
  "examples": [
    {
      "user": "كم عدد المعاملات في جزيرة ياس في 2023؟",
      "notes": "First call search_geospatial_metadata(query='جزيرة ياس'), then use returned district name."
    },
    {
      "user": "How many transactions in Yas Island in 2023?"
    }
  ],
  "geminiSchema": {
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

Notes:
- Keep `description` short.
- Put the long-form guidance in `whenToUse` and `examples` for retrieval.
- `geminiSchema` should be compatible with your current `FunctionDeclaration` usage.

### 1.2 Generate Gemini tool declarations from SSOT

Refactor `lib/mcp/toolRegistry.ts` so it is generated from the JSON metadata (instead of hand-written schemas).

**Acceptance criteria:** the existing 10 tools still appear and function identically.

---

## Phase 2 — Tool-RAG Index + Retrieval (1–2 days)

**Deliverable:** a module that returns the best tool subset for a user query.

### 2.1 Retrieval strategy

Start with a **local** solution (no external cost):

- **Hybrid retrieval**:
  - Keyword/BM25-like scoring over `name + description + whenToUse + examples`
  - Small language-agnostic heuristics (year detection, currency detection)

Then optionally upgrade to multilingual embeddings later.

### 2.2 Modules to implement

Create:

- `lib/tool-rag/toolStore.ts`
  - Loads JSON tool docs
  - Validates schema
  - Exposes `getAllTools()` and `getToolByName()`

- `lib/tool-rag/retriever.ts`
  - `selectToolsForMessage(message, options)` returns ordered tool list
  - Always includes critical tools
  - Returns `{ selectedTools, debug }`

- `lib/tool-rag/types.ts`

**Acceptance criteria:** given Arabic or English queries, it reliably surfaces the right tool category (sales/rent/supply/geo) and includes the required tools.

---

## Phase 3 — Wire Tool-RAG into the Current System (0.5–1 day)

**Deliverable:** Gemini receives only selected tool schemas per request.

Modify `lib/gemini/toolCalling.ts`:

1. Before `model.startChat({ tools: ... })`, call the retriever:
   - `const { selectedTools } = selectToolsForMessage(userMessage)`
2. Use `selectedTools` as `functionDeclarations`.
3. Keep the multi-turn loop unchanged.

Logging requirement:
- Log selected tool names per request (debug mode).

**Acceptance criteria:**
- Current Arabic flow still works:
  - search → transaction_count → answer
- For an unrelated question, the router selects a reasonable subset.

---

## Phase 4 — Migration of New Tools (ongoing)

**Deliverable:** process for adding tools without prompt bloat.

When adding a new MCP tool:

1. Implement the tool server-side in `mcp-server/src/...`
2. Add a new tool metadata JSON file in `lib/tool-rag/tools/`
3. Confirm it is exposed via generated Gemini tool registry
4. Add 2–5 examples (Arabic + English) to improve retrieval quality

---

## Phase 5 — Quality, Safety, and Performance (1 day)

### Metrics

- Tool selection latency (target: < 5ms for local retrieval)
- Average selected tool count (target: 8–15)
- Tool-call success rate (schema adherence, fewer retries)

### Guardrails

- Always include `search_geospatial_metadata` when user mentions a location.
- Cap list outputs:
  - tool list outputs: max 20 names
  - tool schemas returned: max 15

### Testing

- Add a small router test suite:
  - Arabic sales query → selects `search_geospatial_metadata`, `get_transaction_count`
  - Rental query → selects rental tools
  - Supply query → selects supply tools

---

## Notes on Cost

- Tool schemas are billed as input tokens by the LLM provider.
- MCP calls themselves are not “prompt tokens”, but **tool outputs** are fed back into the model and therefore count.
- Tool-RAG reduces *baseline* cost by shrinking the tool schema payload per request.

<parameter name="filePath">d:\sandbox\Real States Smart Assistant\geo_assistant\SYSTEM_ARCHITECTURE.md