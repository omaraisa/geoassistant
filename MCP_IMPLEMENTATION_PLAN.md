# MCP-Based Real Estate Smart Assistant Implementation Plan

## Overview
This document outlines a step-by-step plan to build a Model Context Protocol (MCP) based system that enables the chatbot to intelligently answer real estate questions using structured data from CSV files exported from ArcGIS layers.

## Data Structure Understanding

### Geographic Hierarchy
- **Municipality** (e.g., Abu Dhabi City, Al Ain City)
  - **District** (e.g., AL REEM ISLAND, YAS ISLAND)
    - **Community** (e.g., RS3, YN6, RT1)
      - **Project** (e.g., PIXEL, The Magnolias)
        - **Plot** (individual land parcels)

### Data Categories
1. **Geographic Reference Data**: MUNICIPALITY, DISTRICT, COMMUNITY, PROJECT, PLOT
2. **Sales Data**: TRANSACTIONS_DISTRICT, TRANSACTIONS_PROJECT, SALE_RATES_DISTRICT, SALE_RATES_PROJECT
3. **Rental Data**: RENT_REVENUE_DISTRICT, RENT_REVENUE_PROJECT, RENTAL_INDEX_DISTRICT, RENTAL_INDEX_PROJECT
4. **Supply Data**: SUPPLY_DISTRICT, SUPPLY_PROJECT, SUPPLY_COMMUNITY

---

## Implementation Steps

### **Step 1: Create MCP Server Structure**

**Goal**: Set up the basic MCP server infrastructure

**Tasks**:
1. Create a new directory: `geo_assistant/mcp-server/`
2. Initialize package.json with MCP dependencies
3. Create the main server file: `src/index.ts`

**Files to Create**:
```
geo_assistant/mcp-server/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

**Dependencies**:
```json
{
  "@modelcontextprotocol/sdk": "latest",
  "csv-parse": "^5.5.0",
  "papaparse": "^5.4.0"
}
```

**Success Criteria**: MCP server starts and can accept connections

---

### **Step 2: Implement CSV Data Loader**

**Goal**: Create a utility to load and parse all CSV files into memory

**Tasks**:
1. Create `src/dataLoader.ts`
2. Implement functions to load each CSV type
3. Create TypeScript interfaces matching CSV structures
4. Cache loaded data in memory for fast access

**Key Functions**:
```typescript
- loadMunicipalities()
- loadDistricts()
- loadCommunities()
- loadProjects()
- loadTransactionsDistrict()
- loadTransactionsProject()
- loadSaleRatesDistrict()
- loadRentalIndexDistrict()
- loadSupplyData()
```

**Success Criteria**: All CSV files load successfully and data is accessible in memory

---

### **Step 3: Create Data Query Layer**

**Goal**: Build query functions that understand real estate terminology

**Tasks**:
1. Create `src/queries/salesQueries.ts`
2. Create `src/queries/rentalQueries.ts`
3. Create `src/queries/supplyQueries.ts`
4. Create `src/queries/geoQueries.ts`

**Example Query Functions**:

**Sales Queries**:
```typescript
// Descriptive queries
- getTotalSalesValue(district, year, quarter?)
- getSalesVolumeByLocation(district/project, year, layout?)
- getTransactionCount(district, year)
- getAverageSalePricePerSqm(level: 'district'|'community'|'project', filters)
- getTopProjectsBySales(year, limit)
- getMedianSalePrice(typology, layout?)

// Comparative queries
- compareSalesPricesBetweenLocations(location1, location2, filters)
- compareSalesVolumeByDistrict(districts, filters)
- compareQuarterOverQuarter(district, year, quarter)
- findLocationsByPriceIncrease(yearOverYear)
```

**Rental Queries**:
```typescript
// Descriptive queries
- getAverageAnnualRentByCommunity(community, year)
- findUnitsByBudget(budget, bedrooms, year)
- getAverageRentPerSqm(typology, filters)
- getRentalContractsCount(year)
- getMedianRent(bedrooms, filters)

// Comparative queries
- compareRentByTypology(typology1, typology2, filters)
- findHighestRentalGrowthAreas(year1, year2)
- compareRentByArea(area1, area2, filters)
- getProjectsAboveRentalIndex(year, threshold?)
```

**Supply Queries**:
```typescript
// Descriptive queries
- getCurrentSupplyByCommunity(community, year)
- getTotalUnitsByLayoutAndArea(bedrooms, area, year)
- getResidentialVsCommercialSupply(district, year)
- getFutureSupplyDelivery(year)

// Comparative queries
- compareFutureSupply(district1, district2, year)
- identifyOversupplyRisk(districts, threshold)
- compareSupplyVsDemand(district, year)
```

**Geographic Queries**:
```typescript
- findDistrictByName(name)
- findProjectsByDistrict(districtName)
- getLocationHierarchy(projectName)
- resolveAmbiguousLocation(partialName)
```

**Success Criteria**: Query functions return accurate data for test cases

---

### **Step 4: Implement Natural Language Understanding**

**Goal**: Parse user questions into structured queries

**Tasks**:
1. Create `src/nlp/intentClassifier.ts`
2. Create `src/nlp/entityExtractor.ts`
3. Define intent types and entity patterns

**Intent Categories**:
- **Descriptive Sales**: total value, volume, count, average, median
- **Comparative Sales**: compare locations, compare periods
- **Descriptive Rental**: average rent, find by budget, contracts count
- **Comparative Rental**: compare rent levels, growth trends
- **Descriptive Supply**: current supply, future supply, unit counts
- **Comparative Supply**: oversupply analysis, supply vs demand

**Entity Types**:
- Location (District, Community, Project)
- Time (Year, Quarter, Date Range)
- Property Type (Apartment, Villa, Townhouse)
- Layout (Studio, 1BR, 2BR, 3BR, 4BR, 5BR+)
- Metric (Price, Volume, Count)
- Budget/Price Range

**Example NLU Flow**:
```
Input: "What was the total sales value in Abu Dhabi last quarter?"
→ Intent: descriptive_sales_total_value
→ Entities: {location: "Abu Dhabi", timeframe: "Q4 2025"}
→ Query: getTotalSalesValue("Abu Dhabi", 2025, 4)
```

**Success Criteria**: 90% accuracy on sample questions

---

### **Step 5: Define MCP Tools (Resources & Prompts)**

**Goal**: Expose data query capabilities as MCP tools

**Tasks**:
1. Create `src/tools/salesTools.ts`
2. Create `src/tools/rentalTools.ts`
3. Create `src/tools/supplyTools.ts`
4. Register tools with MCP server

**MCP Tool Structure**:
Each tool should follow this pattern:
```typescript
{
  name: "query_sales_data",
  description: "Query real estate sales data with filters",
  inputSchema: {
    type: "object",
    properties: {
      queryType: { type: "string", enum: ["total_value", "volume", "price_per_sqm"] },
      location: { type: "string" },
      year: { type: "number" },
      quarter: { type: "number", optional: true },
      typology: { type: "string", optional: true },
      layout: { type: "string", optional: true }
    }
  }
}
```

**Tools to Implement**:

1. **query_sales_data**
   - Get sales transactions, values, volumes
   - Filter by location, time, property type

2. **query_rental_data**
   - Get rental contracts, revenues, indices
   - Filter by location, time, property type

3. **query_supply_data**
   - Get current and future supply
   - Filter by location, time, property type

4. **compare_locations**
   - Compare any metric between two locations
   - Support sales, rental, supply comparisons

5. **find_properties_by_criteria**
   - Search properties by budget, size, location
   - Support complex filters

6. **analyze_trends**
   - Year-over-year, quarter-over-quarter analysis
   - Growth rates, price changes

7. **get_location_info**
   - Retrieve geographic hierarchy
   - Get district/community/project details

**Success Criteria**: All tools are registered and callable via MCP

---

### **Step 6: Integrate MCP with Chat API**

**Goal**: Connect the chat route to the MCP server

**Tasks**:
1. Update `app/api/chat/route.ts`
2. Add MCP client connection
3. Implement tool calling logic
4. Handle streaming responses

**Implementation**:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize MCP client
const mcpClient = new Client({
  name: "real-estate-assistant",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// Connect to MCP server
await mcpClient.connect(new StdioClientTransport({
  command: "node",
  args: ["./mcp-server/dist/index.js"]
}));

// In POST handler:
export async function POST(request: NextRequest) {
  const { message, conversationHistory } = await request.json();
  
  // 1. Parse user intent
  const intent = await classifyIntent(message);
  
  // 2. Extract entities
  const entities = await extractEntities(message);
  
  // 3. Call appropriate MCP tool
  const toolResult = await mcpClient.callTool({
    name: intent.toolName,
    arguments: entities
  });
  
  // 4. Format response with LLM
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const prompt = buildPrompt(message, toolResult, conversationHistory);
  const response = await model.generateContent(prompt);
  
  return NextResponse.json({ 
    response: response.text(),
    data: toolResult 
  });
}
```

**Success Criteria**: Chat can successfully query data through MCP tools

---

### **Step 7: Add Response Formatting & Context**

**Goal**: Make responses natural, accurate, and informative

**Tasks**:
1. Create `src/formatters/responseFormatter.ts`
2. Implement data visualization suggestions
3. Add context about data quality/source
4. Include follow-up question suggestions

**Response Template**:
```typescript
interface FormattedResponse {
  answer: string;              // Natural language answer
  data: any;                   // Raw data
  visualization?: {            // Suggest map/chart display
    type: 'map' | 'chart' | 'table',
    config: any
  };
  metadata: {
    dataSource: string;
    lastUpdated: string;
    confidence: number;
  };
  followUpQuestions: string[]; // Suggested next questions
}
```

**Example**:
```
Question: "What was the total sales value in Yas Island last quarter?"

Response:
"The total sales value in Yas Island for Q4 2025 was AED 1.2 billion across 
1,234 transactions. This represents a 15% increase compared to Q3 2025.

📊 Data breakdown:
- Apartments: AED 700M (58%)
- Villas: AED 450M (38%)
- Plots: AED 50M (4%)

Would you like to:
• Compare this with Al Reem Island?
• See the breakdown by project?
• View this data on the map?"
```

**Success Criteria**: Responses are clear, accurate, and actionable

---

### **Step 8: Implement Caching & Performance Optimization**

**Goal**: Ensure fast query responses

**Tasks**:
1. Implement in-memory caching for frequently accessed data
2. Pre-compute common aggregations
3. Add query result caching with TTL
4. Optimize CSV parsing (use streams for large files)

**Caching Strategy**:
```typescript
// Cache structure
const cache = {
  rawData: Map<string, any[]>,      // CSV data
  aggregations: Map<string, any>,   // Pre-computed stats
  queryResults: Map<string, any>    // Query cache with TTL
};

// Cache common queries
- Total sales by district (last 5 years)
- Average rent by community (current year)
- Supply by district (current + next year)
- Top 20 projects by sales
```

**Success Criteria**: Query response time < 200ms for cached queries

---

### **Step 9: Add Error Handling & Data Validation**

**Goal**: Handle edge cases and invalid queries gracefully

**Tasks**:
1. Validate location names (handle typos, aliases)
2. Handle missing data gracefully
3. Add date range validation
4. Implement fuzzy matching for ambiguous locations

**Error Scenarios**:
- Unknown location: "Did you mean 'Yas Island' instead of 'Yas'?"
- No data available: "No sales data found for this period. The latest available data is from..."
- Ambiguous query: "Found multiple locations matching 'R1'. Did you mean 'Reem 1 (R1)' or 'Reef 1'?"
- Invalid filter combination: "Villa plots with bedroom count is not applicable"

**Success Criteria**: System handles 95% of edge cases gracefully

---

### **Step 10: Testing & Sample Questions**

**Goal**: Verify system answers all required questions correctly

**Test Suite**:

**Sales - Descriptive**:
```
✓ "What was the total sales value in Abu Dhabi last quarter?"
✓ "What was the total sales volume in Yas Island last quarter for 3BR apartment?"
✓ "How many transactions occurred in Yas Island in 2024?"
✓ "Show me the average sale price per sqm by community"
✓ "Show me the average sale price per sqm by community for 2BR villa"
✓ "Which projects had the highest number of sales this year?"
✓ "What is the median sale price for apartments vs villas?"
```

**Sales - Comparative**:
```
✓ "Compare sale prices between Saadiyat Island and Reem Island"
✓ "Which district has higher sales volume: Al Reem or Yas?"
✓ "How does the current quarter compare to the previous quarter in total sales value?"
✓ "Show communities where sales prices increased year-on-year"
```

**Rental - Descriptive**:
```
✓ "What is the average annual rent by community?"
✓ "With a budget of AED 100,000, which communities can I find a 3BR apartment in?"
✓ "Show me average rent per sqm for apartments"
✓ "How many rental contracts were registered this year?"
✓ "What is the median rent for 2-bedroom units?"
```

**Rental - Comparative**:
```
✓ "Compare rent levels between villas and apartments"
✓ "Which areas experienced the highest rental growth?"
✓ "How does rent in Downtown Abu Dhabi compare to suburban areas?"
✓ "Which projects are above the rental index benchmark?"
```

**Supply - Descriptive**:
```
✓ "What is the current housing supply by community?"
✓ "What is the total number of 2BR units in YN7 for 2024?"
✓ "Show total residential vs commercial supply"
✓ "How many units are expected to be delivered next year?"
```

**Supply - Comparative**:
```
✓ "Compare future supply between Yas Island and Saadiyat"
✓ "Which districts have oversupply risk?"
✓ "How does supply growth compare to transaction demand?"
```

**Success Criteria**: All sample questions answered correctly with >90% accuracy

---

### **Step 11: Add Map Visualization Integration**

**Goal**: Enable the chat to trigger map visualizations

**Tasks**:
1. Create map command protocol between chat and MapContainer
2. Implement location highlighting on map
3. Add data layer toggling
4. Create heatmaps for metrics

**Map Commands**:
```typescript
interface MapCommand {
  action: 'highlight' | 'filter' | 'heatmap' | 'compare';
  locations: string[];
  metric?: string;
  data?: any;
}

// Example: "Show me Yas Island on the map"
→ { action: 'highlight', locations: ['YAS ISLAND'] }

// Example: "Show me a heatmap of average prices"
→ { action: 'heatmap', metric: 'avg_price', data: {...} }
```

**Implementation**:
1. Update `components/AppContext.tsx` to handle map commands
2. Update `components/map/MapContainer.tsx` to receive commands
3. Use ArcGIS API to highlight/query features
4. Add visual feedback for user queries

**Success Criteria**: Questions with location context trigger map updates

---

### **Step 12: Add Conversation Memory & Context**

**Goal**: Enable multi-turn conversations with context awareness

**Tasks**:
1. Implement conversation state management
2. Track referenced locations, time periods, metrics
3. Handle follow-up questions with implicit context
4. Add conversation history to prompts

**Context Tracking**:
```typescript
interface ConversationContext {
  recentLocations: string[];
  currentTimeframe: { year: number, quarter?: number };
  currentMetric: string;
  lastQuery: Query;
  comparisonMode: boolean;
}

// Example conversation:
User: "What was the sales value in Yas Island last year?"
→ Context: { locations: ['YAS ISLAND'], timeframe: {year: 2024} }

User: "How about Al Reem?"
→ Implicit query: "What was the sales value in Al Reem last year?"
→ Uses context to complete the question
```

**Success Criteria**: System handles 3+ turn conversations correctly

---

### **Step 13: Documentation & Deployment**

**Goal**: Document the system and prepare for deployment

**Tasks**:
1. Write API documentation
2. Create user guide for supported questions
3. Document data update procedures
4. Set up logging and monitoring

**Documentation Files**:
- `MCP_SERVER_API.md` - MCP tool reference
- `SUPPORTED_QUESTIONS.md` - User guide with examples
- `DATA_UPDATE_GUIDE.md` - How to update CSV files
- `DEPLOYMENT.md` - Production deployment guide

**Deployment Checklist**:
```
□ MCP server runs as background service
□ CSV data files are regularly updated
□ Error logging to file/service
□ Performance monitoring
□ Rate limiting implemented
□ API key management
□ CORS configuration
□ Environment variables documented
```

**Success Criteria**: System is production-ready with complete documentation

---

## Technology Stack

### Core Technologies
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **TypeScript**: Type-safe implementation
- **Node.js**: Runtime environment
- **CSV Parser**: `papaparse` or `csv-parse`
- **LLM**: Google Gemini 2.5 Flash (via existing integration)

### Optional Enhancements
- **Redis**: Query result caching
- **PostgreSQL**: Store processed data for complex queries
- **ElasticSearch**: Full-text search for location names
- **PM2**: Process management for MCP server

---

## File Structure (Complete)

```
geo_assistant/
├── app/
│   └── api/
│       └── chat/
│           └── route.ts              # Updated with MCP integration
├── mcp-server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   └── src/
│       ├── index.ts                  # MCP server entry point
│       ├── dataLoader.ts             # CSV loading utilities
│       ├── cache.ts                  # Caching layer
│       ├── types/
│       │   ├── geographic.ts         # Municipality, District, Community types
│       │   ├── sales.ts              # Transaction, SaleRate types
│       │   ├── rental.ts             # Rental, RentalIndex types
│       │   └── supply.ts             # Supply types
│       ├── queries/
│       │   ├── salesQueries.ts       # Sales data queries
│       │   ├── rentalQueries.ts      # Rental data queries
│       │   ├── supplyQueries.ts      # Supply data queries
│       │   └── geoQueries.ts         # Geographic queries
│       ├── nlp/
│       │   ├── intentClassifier.ts   # Intent recognition
│       │   └── entityExtractor.ts    # Entity extraction
│       ├── tools/
│       │   ├── salesTools.ts         # MCP sales tools
│       │   ├── rentalTools.ts        # MCP rental tools
│       │   ├── supplyTools.ts        # MCP supply tools
│       │   └── geoTools.ts           # MCP geographic tools
│       ├── formatters/
│       │   └── responseFormatter.ts  # Response formatting
│       └── utils/
│           ├── validators.ts         # Input validation
│           └── helpers.ts            # Utility functions
├── docs/
│   ├── MCP_SERVER_API.md
│   ├── SUPPORTED_QUESTIONS.md
│   ├── DATA_UPDATE_GUIDE.md
│   └── DEPLOYMENT.md
└── tests/
    ├── queries/
    ├── tools/
    └── integration/
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User Interface                             │
│                     (Chat Component in Next.js)                      │
└─────────────────┬───────────────────────────────────────────────────┘
                  │ User Question
                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Chat API Route (route.ts)                         │
│  1. Receive question                                                 │
│  2. Classify intent & extract entities (NLP)                         │
│  3. Call MCP tool with structured query                              │
└─────────────────┬───────────────────────────────────────────────────┘
                  │ MCP Tool Call
                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        MCP Server                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Tool Router                              │   │
│  └───────────┬─────────────────────────────┬────────────────────┘   │
│              ↓                             ↓                         │
│  ┌─────────────────────┐      ┌───────────────────────┐             │
│  │   Sales Tools       │      │   Rental Tools        │             │
│  └──────────┬──────────┘      └──────────┬────────────┘             │
│             ↓                            ↓                           │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Query Layer                             │            │
│  │  - salesQueries.ts                                   │            │
│  │  - rentalQueries.ts                                  │            │
│  │  - supplyQueries.ts                                  │            │
│  └──────────┬───────────────────────────────────────────┘            │
│             ↓                                                        │
│  ┌─────────────────────────────────────────────────────┐            │
│  │              Data Access Layer                       │            │
│  │  - In-memory cached CSV data                         │            │
│  │  - Pre-computed aggregations                         │            │
│  └──────────────────────────────────────────────────────┘            │
└─────────────────┬───────────────────────────────────────────────────┘
                  │ Query Results
                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Chat API Route (route.ts)                         │
│  1. Receive tool result                                              │
│  2. Format with LLM (Gemini)                                         │
│  3. Add visualization suggestions                                    │
│  4. Return natural language response                                 │
└─────────────────┬───────────────────────────────────────────────────┘
                  │ Formatted Response
                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      User Interface                                  │
│  - Display answer                                                    │
│  - Trigger map visualization (if applicable)                         │
│  - Show follow-up suggestions                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Timeline

### Phase 1 (Week 1)
- Steps 1-3: MCP server setup, data loading, basic queries

### Phase 2 (Week 2)
- Steps 4-6: NLU, MCP tools, chat integration

### Phase 3 (Week 3)
- Steps 7-9: Response formatting, optimization, error handling

### Phase 4 (Week 4)
- Steps 10-13: Testing, map integration, documentation, deployment

---

## Key Benefits of This Architecture

1. **Separation of Concerns**: Data logic separated from UI and LLM
2. **Scalability**: Easy to add new data sources or query types
3. **Performance**: In-memory caching for fast responses
4. **Flexibility**: Can swap LLM or add multiple LLM backends
5. **Maintainability**: Clear structure makes updates easier
6. **Testability**: Each component can be tested independently
7. **Type Safety**: TypeScript ensures data consistency
8. **MCP Standard**: Future-proof with industry standard protocol

---

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Begin with Step 1: Create MCP server structure
4. Implement incrementally, testing each step
5. Iterate based on testing feedback

---

## Notes

- All CSV files are currently in `Tables/` folder - MCP server will read from there
- Data is static exports from ArcGIS - update process needed for production
- Consider adding data versioning/timestamp tracking
- Consider adding user authentication for production deployment
- May need to handle Arabic language queries in future enhancement
