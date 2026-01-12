# Real Estate Smart Assistant - Architecture Overview

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                     (http://localhost:3000)                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP POST /api/chat
                 │ { message: "What was sales in Yas?" }
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              NEXT.JS APP (Port 3000)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  /app/api/chat/route.ts                                   │  │
│  │  1. Receive user question                                 │  │
│  │  2. Parse with NLU (lib/nlu/queryParser.ts)              │  │
│  │  3. If confidence > 70% → call MCP                        │  │
│  └────────────────┬──────────────────────────────────────────┘  │
│                   │                                              │
│                   │ executeQuery(tool, params)                  │
│                   ↓                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  lib/mcp/mcpClient.ts                                     │  │
│  │  - Singleton MCP Client                                   │  │
│  │  - Spawns MCP server as child process                     │  │
│  │  - Uses STDIO transport (not HTTP!)                       │  │
│  └────────────────┬──────────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ StdioClientTransport
                    │ node ../mcp-server/dist/index.js
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│         MCP SERVER (Child Process - STDIO)                       │
│         mcp-server/dist/index.js                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Registered Tools:                                        │  │
│  │  - get_total_sales_value                                  │  │
│  │  - get_transaction_count                                  │  │
│  │  - compare_sales_between_districts                        │  │
│  │  - find_units_by_budget                                   │  │
│  │  - get_current_supply                                     │  │
│  │  - get_districts                                          │  │
│  └────────────────┬──────────────────────────────────────────┘  │
│                   │                                              │
│                   │ Query data                                  │
│                   ↓                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  src/dataLoader.ts                                        │  │
│  │  - ArcGIS REST API Client                                 │  │
│  │  - Layer queries with caching                             │  │
│  │  - Data transformation                                    │  │
│  └────────────────┬──────────────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    │ HTTPS GET
                    │ where=DISTRICT_NAME_EN='YAS ISLAND' AND YEAR=2024
                    │
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│              ARCGIS REST API (localhost:6443)                    │
│  https://localhost:6443/arcgis/rest/services/RealStates/...     │
│                                                                  │
│  Layers:                                                         │
│  - Layer 17: TRANSACTIONS_DISTRICT                               │
│  - Layer 9: RENT_REVENUE_DISTRICT                                │
│  - Layer 14: SUPPLY_DISTRICT                                     │
│  - etc.                                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## What You Need to Run

### ✅ ONLY ONE COMMAND NEEDED:

```bash
cd geo_assistant
npm run dev
```

That's it! The Next.js app will:
1. Start on port 3000
2. **Automatically spawn the MCP server** when first chat request arrives
3. Keep the MCP server running as a child process

### ❌ What You DON'T Need:

- ❌ No separate MCP server command
- ❌ No additional terminal windows
- ❌ No manual server management

---

## How It Works

### 1. **MCP Server is NOT a Standalone Server**

The MCP server is **NOT** an HTTP/REST API server. It's a **stdio-based process**:

```typescript
// In mcpClient.ts
const transport = new StdioClientTransport({
  command: 'node',                      // Spawn node process
  args: ['../mcp-server/dist/index.js'] // Run this script
});
```

This means:
- The Next.js app spawns `node mcp-server/dist/index.js` as a **child process**
- Communication happens via **stdin/stdout** (not HTTP)
- The process stays alive for the lifetime of the Next.js app
- If Next.js restarts, the MCP server is automatically respawned

### 2. **Data Flow for a User Question**

Example: "What was the total sales value in Yas Island in 2024?"

```
1. Browser → Next.js
   POST /api/chat
   { message: "What was the total sales value in Yas Island in 2024?" }

2. Next.js → NLU Parser
   parseQuery(message)
   → { tool: 'get_total_sales_value', entities: { district: 'YAS ISLAND', year: 2024 } }

3. Next.js → MCP Client
   executeQuery('get_total_sales_value', { district: 'YAS ISLAND', year: 2024 })
   → Spawns/connects to MCP server via stdio

4. MCP Server → Data Loader
   Query ArcGIS API for layer 17 (TRANSACTIONS_DISTRICT)
   where: DISTRICT_NAME_EN='YAS ISLAND' AND YEAR=2024

5. ArcGIS → MCP Server
   Returns 97 records with sales data

6. MCP Server → Next.js
   Returns formatted text:
   "Sales Data for YAS ISLAND in 2024:
    Total Value: AED 113,364,913,855.04
    Total Volume: 39,784 transactions"

7. Next.js → Google Gemini
   Prompt: "Here is data from our database: [MCP response]
            Use ONLY this data to answer: [user question]"

8. Gemini → Next.js
   Natural language response

9. Next.js → Browser
   Displays conversational answer with real data
```

---

## Component Breakdown

### **Frontend (Browser)**
- **Location**: `geo_assistant/app/page.tsx`, `components/chat/Sidebar.tsx`
- **Purpose**: User interface for chat and map
- **Tech**: Next.js 15, React, Tailwind CSS

### **API Layer (Next.js)**
- **Location**: `geo_assistant/app/api/chat/route.ts`
- **Purpose**: Handle chat requests, orchestrate NLU + MCP + LLM
- **Tech**: Next.js API routes, Google Gemini 2.5 Flash

### **NLU Layer**
- **Location**: `geo_assistant/lib/nlu/queryParser.ts`
- **Purpose**: Parse natural language into structured queries
- **Output**: `{ tool: string, entities: object, confidence: number }`

### **MCP Client**
- **Location**: `geo_assistant/lib/mcp/mcpClient.ts`
- **Purpose**: Spawn and communicate with MCP server
- **Tech**: `@modelcontextprotocol/sdk`, stdio transport

### **MCP Server**
- **Location**: `geo_assistant/mcp-server/src/index.ts`
- **Purpose**: Expose data query tools via MCP protocol
- **Tech**: MCP SDK, registers 8 tools
- **Run Mode**: Child process spawned by Next.js

### **Data Loader**
- **Location**: `geo_assistant/mcp-server/src/dataLoader.ts`
- **Purpose**: Query ArcGIS REST API, cache results
- **Tech**: axios, in-memory caching

### **ArcGIS Server**
- **Location**: External (localhost:6443)
- **Purpose**: Serve geographic and real estate data
- **Tech**: ArcGIS Enterprise REST API

---

## Development Workflow

### **Starting the App**

```bash
# Terminal 1 (Only one you need!)
cd geo_assistant
npm run dev
```

**What happens:**
1. Next.js starts on http://localhost:3000
2. Visit http://localhost:3000
3. Type a question in chat
4. First request triggers MCP server spawn
5. MCP server stays alive for duration of Next.js session

### **Making Changes**

**Frontend Changes:**
- Edit files in `app/`, `components/`
- Hot reload works automatically

**Chat API Changes:**
- Edit `app/api/chat/route.ts`
- Changes take effect on next request

**NLU Changes:**
- Edit `lib/nlu/queryParser.ts`
- Test with: `npx tsx tests/test-nlu.ts`

**MCP Server Changes:**
- Edit files in `mcp-server/src/`
- Rebuild: `cd mcp-server && npm run build`
- Restart Next.js to reload MCP server

### **Testing**

```bash
# Test NLU parser
cd geo_assistant
npx tsx tests/test-nlu.ts

# Test MCP server directly
cd mcp-server
node test.mjs
```

---

## Troubleshooting

### Problem: "MCP client not connected"

**Cause**: MCP server failed to spawn or path is wrong

**Fix**:
```bash
# Ensure MCP server is built
cd mcp-server
npm run build

# Check dist/index.js exists
ls dist/index.js
```

### Problem: "Cannot find module '../mcp-server/dist/index.js'"

**Cause**: Wrong relative path in mcpClient.ts

**Fix**: Path is relative to compiled Next.js code location
```typescript
// In mcpClient.ts - adjust if needed
args: ['../mcp-server/dist/index.js']  // or absolute path
```

### Problem: Chat gives wrong answers

**Check logs in terminal:**
```
[Chat API] Received message: ...
[Chat API] Parsed query: ...
[Chat API] MCP Response: ...
```

If no MCP response → NLU didn't parse correctly
If wrong MCP response → ArcGIS query issue
If right MCP response but wrong answer → LLM prompt issue

---

## Production Deployment

For production, you would:

1. **Build both apps:**
   ```bash
   cd mcp-server && npm run build
   cd ../geo_assistant && npm run build
   ```

2. **Run Next.js:**
   ```bash
   npm start
   ```

3. **MCP server runs automatically** as child process

Alternative: Deploy MCP as separate service with stdio-over-network transport

---

## Key Insights

1. **MCP is not HTTP** - It uses stdin/stdout for communication
2. **No separate server** - MCP runs as child of Next.js
3. **Single command** - Just `npm run dev`
4. **Auto-restart** - MCP respawns when Next.js restarts
5. **Caching** - Data is cached in MCP server memory

---

## Summary

**To run your system:**
```bash
cd geo_assistant
npm run dev
```

**That's all!** The MCP server will automatically start when needed.
