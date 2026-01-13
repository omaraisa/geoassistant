# Migration Plan: NLU Pre-Execution → True MCP Tool Calling

**Date:** January 13, 2026  
**Status:** Planning  
**Priority:** High (fixes Arabic/multilingual support)  

---

## Executive Summary

Migrate from **pre-execution NLU model** (English-only, regex-based) to **true MCP tool calling** using Gemini's native tool-use capability. This enables:

- ✅ Arabic & multilingual support
- ✅ Synonym/variation handling
- ✅ Complex multi-step reasoning
- ✅ Future-proof architecture
- ✅ Reduced token cost (no NLU pre-processing)

**Trade-off:** +0.0002 credits/query (negligible) for significantly better accuracy and language support

---

## Current State Analysis

### ❌ Current Architecture (Broken)

```
User Question (any language)
    ↓
[BROKEN POINT] NLU Parser (English-only regex)
    ↓
If no match → fall back to LLM (no tool use)
    ↓
Pre-execute matched tool (if found)
    ↓
Inject result into prompt
    ↓
Gemini formats response
```

### Problems

1. **Arabic Questions Fail**
   - NLU parser uses English aliases: `'yas': 'YAS ISLAND'`
   - Doesn't recognize Arabic: `'ياس'` or `'جزيرة ياس'`
   - No fallback → LLM doesn't know to call tools

2. **Synonym Blindness**
   - "transactions" works, but "deals", "contracts", "sales volume" fail
   - Each variant needs manual regex pattern

3. **Single Language Per Question**
   - "Tell me about Yas Island transactions" works
   - "أخبرني عن معاملات جزيرة ياس" fails
   - Mixed: "ياس Island معاملات" fails

4. **No Fallback to Gemini**
   - If NLU fails to parse, Gemini can't see the tools
   - It falls back to pure LLM response (hallucinations possible)

5. **Token Inefficiency**
   - NLU processing adds overhead
   - Better to let Gemini handle language understanding

### Current File Structure

```
app/api/chat/route.ts
├─ 1. Parse user message with NLU
├─ 2. Check confidence > 0.7
├─ 3. Pre-execute MCP tool
├─ 4. Inject result into prompt
└─ 5. Call Gemini

lib/nlu/queryParser.ts
├─ District aliases (English only)
├─ Municipality aliases
├─ Regex patterns for intents
└─ Manual entity extraction

lib/mcp/mcpClient.ts
├─ Connects to MCP server
└─ executeQuery(tool, params)
```

---

## Target State

### ✅ True MCP Tool Calling

```
User Question (any language)
    ↓
Gemini sees registered MCP tools
    ↓
Gemini calls appropriate tool (AI-driven decision)
    ↓
MCP executes tool with Gemini-provided parameters
    ↓
Gemini receives tool result
    ↓
Gemini generates natural language response
    ↓
User gets answer in their language
```

### Benefits

| Aspect | Current | New | Benefit |
|--------|---------|-----|---------|
| **Arabic Support** | ❌ No | ✅ Yes | Handles Arabic natively |
| **Synonyms** | ❌ Limited | ✅ Full | "transactions" = "deals" = "contracts" |
| **Language Mix** | ❌ No | ✅ Yes | "ياس Island 2024 معاملات" works |
| **Tool Discovery** | Manual regex | AI reasoning | Gemini understands context |
| **Multi-step Queries** | Single tool | Multiple tools | "Compare Yas and Al Reem, then show top projects" |
| **New Tool Addition** | Update regex | Register tool | Automatic AI integration |
| **Token Efficiency** | ~2000 tokens | ~1500 tokens | 25% reduction |

---

## Migration Steps

### Phase 1: Preparation (2-3 hours)

#### Step 1.1: Document Current Tool Contract
**File:** `MCP_TOOLS_CONTRACT.md` (new)

For each tool, document:
```typescript
Tool: get_total_sales_value
Purpose: Get total sales value for a district in a given year
Parameters:
  - district: string (required, example: "YAS ISLAND")
  - year: number (required, example: 2024)
  - typology: string (optional, example: "Apartment")
  - layout: string (optional, example: "3 beds")
Returns:
  - totalValue: number (in AED)
  - totalVolume: number (transaction count)
  - averagePrice: number (AED per transaction)
Examples:
  - "Total sales in Yas Island 2024"
  - "إجمالي المبيعات في جزيرة ياس 2024"
  - "Sales value for 3BR apartments in Yas"
```

**Time:** 1 hour  
**Owner:** You (review current tools)

#### Step 1.2: Gemini API Tool Calling Research
**File:** Research notes

Learn Gemini's tool calling:
- [Google AI Tool Use](https://ai.google.dev/gemini-2-5/docs/think-step-by-step)
- Tool schema format
- Response format
- Tool execution flow

**Time:** 1 hour  
**Owner:** Me (provide examples)

#### Step 1.3: Create Test Cases
**File:** `tests/test-multilingual-tools.ts` (new)

```typescript
const testCases = [
  {
    question: "What was the total sales value in Yas Island in 2024?",
    expectedTool: "get_total_sales_value",
    expectedParams: { district: "YAS ISLAND", year: 2024 }
  },
  {
    question: "كم عدد المعاملات العقارية في جزيرة ياس عام 2024؟",
    expectedTool: "get_transaction_count",
    expectedParams: { district: "YAS ISLAND", year: 2024 }
  },
  {
    question: "How many deals in ياس 2024?",
    expectedTool: "get_transaction_count",
    expectedParams: { district: "YAS ISLAND", year: 2024 }
  },
  // ... more multilingual variations
];
```

**Time:** 1 hour  
**Owner:** You + Me (collaborative)

---

### Phase 2: Implementation (6-8 hours)

#### Step 2.1: Create Tool Registry
**File:** `lib/mcp/toolRegistry.ts` (new)

```typescript
export const MCP_TOOLS = [
  {
    name: 'get_total_sales_value',
    description: 'Get total sales value and volume for a district/year. Works in English and Arabic.',
    inputSchema: {
      type: 'object',
      properties: {
        district: {
          type: 'string',
          description: 'District name in English (e.g., "YAS ISLAND", "AL REEM ISLAND"). Can extract from Arabic.'
        },
        year: {
          type: 'number',
          description: 'Year of transactions (e.g., 2024)'
        },
        typology: {
          type: 'string',
          description: 'Optional property type (Apartment, Villa, Townhouse)'
        },
        layout: {
          type: 'string',
          description: 'Optional bedroom count (1 bed, 2 beds, 3 beds, etc.)'
        }
      },
      required: ['district', 'year']
    }
  },
  {
    name: 'get_transaction_count',
    description: 'Get number of property transactions in a district/year',
    inputSchema: {
      type: 'object',
      properties: {
        district: { type: 'string', description: 'District name' },
        year: { type: 'number', description: 'Year' }
      },
      required: ['district', 'year']
    }
  },
  // ... all other tools
];

// Export for Gemini
export function getToolsForGemini() {
  return MCP_TOOLS.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }));
}
```

**Time:** 2 hours  
**Owner:** Me

#### Step 2.2: Create Gemini Tool Calling Handler
**File:** `lib/gemini/toolCalling.ts` (new)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getToolsForGemini } from '@/lib/mcp/toolRegistry';
import { executeQuery } from '@/lib/mcp/mcpClient';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function askGeminiWithTools(userMessage: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [
      {
        googleSearch: {} // Optional: let Gemini search if needed
      }
    ]
  });

  // Convert our tools to Gemini format
  const tools = getToolsForGemini();
  
  // First call: Gemini sees tools and decides which to use
  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: userMessage
          }
        ]
      }
    ],
    tools: [{
      functionDeclarations: tools
    }]
  });

  // Check if Gemini decided to call a tool
  const toolUseFound = response.response.functionCalls();
  
  if (!toolUseFound || toolUseFound.length === 0) {
    // No tool needed, just respond
    return response.response.text();
  }

  // Execute each tool Gemini requested
  const toolResults = [];
  for (const toolCall of toolUseFound) {
    const toolName = toolCall.name;
    const toolArgs = toolCall.args;

    console.log(`[Gemini Tool Call] ${toolName}(${JSON.stringify(toolArgs)})`);

    // Execute through MCP
    const result = await executeQuery(toolName, toolArgs);
    
    toolResults.push({
      functionName: toolName,
      content: result
    });
  }

  // Second call: Gemini receives tool results and generates response
  const finalResponse = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: userMessage
          }
        ]
      },
      {
        role: 'model',
        parts: response.response.candidates[0].content.parts
      },
      {
        role: 'user',
        parts: toolResults.map(result => ({
          functionResponse: {
            name: result.functionName,
            response: result.content
          }
        }))
      }
    ]
  });

  return finalResponse.response.text();
}
```

**Time:** 2 hours  
**Owner:** Me

#### Step 2.3: Update Chat API Route
**File:** `app/api/chat/route.ts` (refactor)

```typescript
import { askGeminiWithTools } from '@/lib/gemini/toolCalling';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    console.log('[Chat API] User message:', message);

    // NEW: Use true tool calling instead of NLU pre-execution
    const response = await askGeminiWithTools(message);

    console.log('[Chat API] Gemini response length:', response.length);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
```

**Time:** 1 hour  
**Owner:** Me

#### Step 2.4: Simplify MCP Client
**File:** `lib/mcp/mcpClient.ts` (minor updates)

```typescript
// No major changes, just ensure:
// - executeQuery accepts any tool name
// - Error handling is robust
// - Logging shows what tool was called

// Remove NLU-specific methods if any
```

**Time:** 1 hour  
**Owner:** Me

#### Step 2.5: Remove NLU Parser (Deprecated)
**File:** `lib/nlu/queryParser.ts` (archive)

```typescript
// Keep as reference, but mark as DEPRECATED
// All functionality moved to Gemini's native understanding
```

**Time:** 30 minutes  
**Owner:** Me

---

### Phase 3: Testing (4-6 hours)

#### Step 3.1: Unit Tests
**File:** `tests/gemini-tool-calling.test.ts` (new)

```typescript
describe('Gemini Tool Calling', () => {
  it('should call get_transaction_count for English query', async () => {
    const response = await askGeminiWithTools(
      'How many transactions in Yas Island 2024?'
    );
    expect(response).toContain('39,784');
  });

  it('should call get_transaction_count for Arabic query', async () => {
    const response = await askGeminiWithTools(
      'كم عدد المعاملات في جزيرة ياس 2024؟'
    );
    expect(response).toContain('39,784');
  });

  it('should handle mixed language queries', async () => {
    const response = await askGeminiWithTools(
      'معاملات ياس Island 2024 transactions'
    );
    expect(response).toContain('39,784');
  });

  it('should handle synonyms', async () => {
    const q1 = await askGeminiWithTools('Transactions in Yas 2024');
    const q2 = await askGeminiWithTools('Deals in Yas 2024');
    const q3 = await askGeminiWithTools('Sales volume Yas 2024');
    // All should return same data
  });

  it('should handle multi-step queries', async () => {
    const response = await askGeminiWithTools(
      'Compare Yas Island and Al Reem Island, show top 3'
    );
    expect(response).toContain('YAS ISLAND');
    expect(response).toContain('AL REEM ISLAND');
  });
});
```

**Time:** 2 hours  
**Owner:** Me

#### Step 3.2: Manual Testing (All Languages)
**File:** `TESTING_CHECKLIST.md` (new)

Test matrix:
```
| Query | Language | Status | Notes |
|-------|----------|--------|-------|
| Total sales Yas 2024 | English | [ ] | |
| How many deals Yas? | English | [ ] | |
| معاملات ياس 2024 | Arabic | [ ] | |
| كم عدد المعاملات؟ | Arabic | [ ] | |
| ياس Island 2024 | Mixed | [ ] | |
| Compare Yas vs Reem | English | [ ] | |
| قارن بين ياس والريم | Arabic | [ ] | |
```

**Time:** 2 hours  
**Owner:** You (run on your instance)

#### Step 3.3: Performance Testing
**File:** `tests/performance.test.ts` (new)

```typescript
it('should respond within 5 seconds', async () => {
  const start = Date.now();
  await askGeminiWithTools('How many transactions in Yas 2024?');
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(5000);
});

it('should use <2000 tokens per query', async () => {
  // Monitor token usage via Gemini API
});
```

**Time:** 1 hour  
**Owner:** Me

#### Step 3.4: Regression Testing
**File:** Run existing test suite

```bash
npm run test
npx tsx tests/test-nlu.ts  # Should still pass or be migrated
```

**Time:** 1 hour  
**Owner:** Me

---

### Phase 4: Deployment (2-3 hours)

#### Step 4.1: Create Feature Branch
```bash
git checkout -b feat/true-mcp-tool-calling
```

#### Step 4.2: Merge & Deploy
```bash
# After testing complete
git merge feat/true-mcp-tool-calling
git commit -m "feat: Migrate to true MCP tool calling with Gemini"
npm run build
npm run dev  # Test in staging
```

#### Step 4.3: Monitor & Rollback
- Monitor error rates in first 24 hours
- Keep NLU parser as fallback (disabled)
- Rollback command ready: `git revert <commit-hash>`

---

## Detailed Implementation

### New Tool Schema Format

```typescript
// Gemini expects this format
{
  "name": "get_total_sales_value",
  "description": "Get total sales value for a district/year. Supports English and Arabic district names.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "district": {
        "type": "string",
        "description": "District name in English (YAS ISLAND, AL REEM ISLAND, SAADIYAT ISLAND, etc.)"
      },
      "year": {
        "type": "number",
        "description": "Year of transactions"
      },
      "typology": {
        "type": "string",
        "description": "Optional: Property type (Apartment, Villa, Townhouse)"
      },
      "layout": {
        "type": "string",
        "description": "Optional: Bedroom count (Studio, 1 bed, 2 beds, 3 beds, 4+ beds)"
      }
    },
    "required": ["district", "year"]
  }
}
```

### Gemini Prompt Template

```typescript
const systemPrompt = `You are a Real Estate AI Assistant for Abu Dhabi.

IMPORTANT INSTRUCTIONS:
1. You have access to real estate data tools
2. When a user asks about data, call the appropriate tool
3. You understand English, Arabic, and mixed-language questions
4. Translate Arabic location names to English:
   - "جزيرة ياس" → "YAS ISLAND"
   - "جزيرة الريم" → "AL REEM ISLAND"
   - "جزيرة السعديات" → "SAADIYAT ISLAND"
5. Only provide information from tools, never guess
6. If data is not available, say so clearly

Available tools:
- get_total_sales_value: Total sales value and volume
- get_transaction_count: Number of transactions
- compare_sales_between_districts: Compare two districts
- find_units_by_budget: Find rental units
- get_municipality_sales: Municipality-level aggregation
- get_top_districts_in_municipality: Top districts by municipality
- get_current_supply: Housing supply data

Always respond in the same language as the user asked.`;
```

---

## File Changes Summary

| File | Status | Changes |
|------|--------|---------|
| `lib/mcp/toolRegistry.ts` | NEW | Define all tools for Gemini |
| `lib/gemini/toolCalling.ts` | NEW | Gemini tool calling logic |
| `app/api/chat/route.ts` | MODIFY | Use tool calling instead of NLU |
| `lib/nlu/queryParser.ts` | ARCHIVE | Keep for reference, mark deprecated |
| `lib/mcp/mcpClient.ts` | MINOR | Ensure robust error handling |
| `tests/gemini-tool-calling.test.ts` | NEW | Test tool calling |
| `tests/test-nlu.ts` | ARCHIVE | Replace with new tests |
| `MCP_TOOLS_CONTRACT.md` | NEW | Document all tools |
| `TESTING_CHECKLIST.md` | NEW | Manual testing guide |

---

## Timeline Estimate

| Phase | Tasks | Time | Days |
|-------|-------|------|------|
| **1. Prep** | Document + Research + Tests | 3 hrs | 0.5 |
| **2. Impl** | Registry + Handler + API + Cleanup | 7 hrs | 1 |
| **3. Test** | Unit + Manual + Performance + Regression | 5 hrs | 1 |
| **4. Deploy** | Branch + Merge + Monitor + Rollback | 2 hrs | 0.5 |
| **Total** | | **17 hours** | **~3 days** |

---

## Success Criteria

✅ **Functionality**
- [ ] Arabic questions work
- [ ] Synonyms handled correctly
- [ ] Mixed-language queries work
- [ ] All existing English queries still work

✅ **Quality**
- [ ] Response time < 5 seconds
- [ ] Token cost stable or reduced
- [ ] Error rate < 1%
- [ ] No regressions from current state

✅ **Robustness**
- [ ] Graceful fallback if tool not found
- [ ] Clear error messages
- [ ] Logging shows tool calls
- [ ] Rollback procedure tested

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini fails to call tools | High | Test extensively, have NLU fallback ready |
| Token cost increases | Medium | Monitor usage, optimize prompts |
| Latency increases | Medium | Use turbo models, cache responses |
| Arabic parsing fails | High | Use Gemini's native understanding, test Arabic |
| Multi-tool calls fail | Medium | Test multi-step sequences |

---

## Rollback Plan

If something breaks:

```bash
# 1. Stop production
npm stop

# 2. Revert to previous commit
git revert <new-commit-hash>

# 3. Restore NLU parser as primary
git checkout lib/nlu/queryParser.ts

# 4. Test before restart
npm run test

# 5. Restart with old version
npm run dev
```

**Estimated rollback time:** 15 minutes

---

## Post-Migration

### Future Enhancements
1. Add conversation memory (multi-turn context)
2. Support follow-up questions ("Show me on the map")
3. Add visualization requests ("Show me a chart")
4. Export results to Excel/PDF
5. Schedule data refresh queries

### Tool Expansion
1. Add more query types without code changes
2. Gemini automatically understands new tools
3. User can ask variations immediately

---

## Sign-Off

**Prepared by:** AI Assistant  
**Date:** January 13, 2026  
**Status:** Ready for review  

**Next Step:** You review this plan and approve to proceed with Phase 1
