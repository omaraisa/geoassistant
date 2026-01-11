# Real Estate Smart Assistant - ArcGIS Migration & Production Plan

This plan outlines the roadmap to transition the GeoAI Assistant from a CSV-based prototype to a robust, production-ready application powered by ArcGIS Server Map Services. It specifically addresses data complexity, AI understanding of domain terminology, and the hierarchical nature of Abu Dhabi real estate data.

## Phase 1: Data Engineering & Service Publishing
**Goal:** Publish optimized Map/Feature Services that act as the single source of truth.

1.  **Service Structuring**
    *   **Administrative Service**: Publish `Municipality`, `District`, `Community`, `Project`, `Plot` as a single Map Service with 5 layers.
        *   *Benefit*: Single endpoint for geometry and boundary queries.
    *   **Thematic Services (Tables/Layers)**: Publish the statistical data (`TRANSACTIONS`, `RENTAL_INDEX`, `SUPPLY`) as standalone tables or joined layers if geometry exists.
        *   *Recommendation*: Since `SUPPLY_PLOT` has geometry, publish it as a Feature Layer. For `TRANSACTIONS_DISTRICT` (tabular), publish as a Standalone Table in the service.

2.  **Data Standardization (Crucial for AI)**
    *   **Field Aliases**: Apply clear aliases in ArcGIS Pro before publishing.
        *   `layout` -> `Bedroom Configuration`
        *   `typology` -> `Property Type`
    *   **Domain Values**: Ensure consistency. If one table uses "Apartment" and another "Apt", standardize them or create a mapping layer.

## Phase 2: The "Knowledge Layer" (Bridging AI & Data)
**Goal:** Create a code layer that translates vague user intent into precise ArcGIS SQL queries.

1.  **Data Dictionary / Schema Config**
    *   Create a `lib/data/schema.ts` file.
    *   **Mappings**: Map user terms to database values.
        ```typescript
        export const BEDROOM_MAPPINGS = {
          '1 bedroom': '1 bed',
          '1 bhk': '1 bed',
          '2 bedrooms': '2 beds',
          'studio': 'Studio'
        };
        ```
    *   **Layer URLs**: Centralize all ArcGIS REST API endpoints.

2.  **Smart Query Builder**
    *   Develop a utility `buildWhereClause(params)` that handles the "fuzzy" matching.
    *   *Example*: If user asks for "Villas in Yas Island", the builder creates: `Upper(typology) LIKE '%VILLA%' AND district_id = 1330`.

## Phase 3: Backend Refactoring (CSV to ArcGIS REST)
**Goal:** Replace local CSV parsing with live server queries.

1.  **Refactor `lib/data/queries.ts`**
    *   Remove `papaparse`.
    *   Import `@arcgis/core/rest/query` and `Query`.
    *   Implement `queryFeatures` for each data retrieval function.
    *   **Pattern**:
        1.  **Resolve Location**: Query `District/Project` layer to get the ID (e.g., "Yas Island" -> ID 1330).
        2.  **Fetch Data**: Query the statistical table (e.g., `TRANSACTIONS_DISTRICT`) using `district_id = 1330`.

2.  **Handling Data Gaps (The "Supply Layer" Issue)**
    *   Implement "Fallback Logic".
    *   If a user asks for Plot Supply and the query returns 0 results (because that plot isn't in `SUPPLY_PLOT`), the system should automatically aggregate up and return the **Project** or **Community** supply instead, with a message: *"Specific plot data not available, showing community average."*

## Phase 4: AI Agent Refinement
**Goal:** Teach the AI the "Shape" of the data.

1.  **System Prompt Update**
    *   Explicitly describe the hierarchy: "Municipality > District > Community > Project > Plot".
    *   Explain the fields: "The 'layout' field refers to the number of bedrooms (e.g., '2 beds')."
    *   **Strategy**: "Always try to identify the specific location level. If the user says 'Yas Island', query the District layer. If they say 'Sun and Sky', query the Project layer."

2.  **Tool Definition Update**
    *   Update `get_sales_info` etc., to accept a `level` parameter (`district`, `project`, `community`).
    *   The AI decides the level based on the user's entity name.

## Phase 5: Frontend & Map Integration
**Goal:** Visualize the live services.

1.  **Map Component Update**
    *   Replace any client-side graphics with `FeatureLayer` instances pointing to the Map Service URLs.
    *   Implement `definitionExpression` to filter the map based on chat context (e.g., User: "Show me Reem Island" -> Map filters to show only Reem Island features).

2.  **Interactive Highlighting**
    *   When the AI talks about a specific `Project`, query the Project layer's geometry and zoom/highlight it on the map.

## Phase 6: Testing & Validation
1.  **Scenario Testing**:
    *   "Compare Sales in Yas Island vs Reem Island" (District Level).
    *   "How many 2-bed units are in Meera project?" (Project Level + Attribute Filter).
    *   "Show me the supply for Plot C2 in RR5" (Plot Level - testing the sparse data).

## Success Metrics
*   **Accuracy**: AI correctly maps "3 bedroom" to `layout = '3 beds'`.
*   **Resilience**: App doesn't crash when data is missing for a specific plot.
*   **Performance**: Map and Charts load within 2 seconds.
