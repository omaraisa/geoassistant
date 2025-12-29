# Real Estate Smart Assistant POC - Development Plan

This plan outlines the steps to build a Next.js-based GeoAI agent application. The app features an ArcGIS map, an AI assistant sidebar (Gemini), and data visualization tools (tables, charts).

## Phase 1: Project Initialization & Setup
- [ ] **Initialize Next.js Project**
    - Create a new Next.js app with TypeScript and Tailwind CSS.
    - `npx create-next-app@latest . --typescript --tailwind --eslint`
- [ ] **Install Dependencies**
    - [ ] ArcGIS Maps SDK: `@arcgis/core`
    - [ ] AI Integration: `ai` (Vercel AI SDK), `@google/generative-ai`
    - [ ] UI Components: `lucide-react`, `clsx`, `tailwind-merge` (or shadcn/ui)
    - [ ] Charts: `recharts` or `chart.js`
    - [ ] Data Parsing: `papaparse` (for loading the CSVs provided)
- [ ] **Project Structure Setup**
    - Define folders: `components/map`, `components/ui`, `components/chat`, `lib/data`, `lib/arcgis`, `app/api/chat`.

## Phase 2: Core UI Layout & Components
- [ ] **Main Layout Shell**
    - Create a responsive layout with a fixed Sidebar (Left), Map Area (Center/Right), and Collapsible Bottom Panel.
- [ ] **Sidebar Component**
    - Chat interface container.
    - Input field and message history display.
- [ ] **Bottom Panel Component**
    - Tabbed interface for "Attribute Table" and "Charts".
    - Visibility toggle (hidden by default, opens when AI returns data).
- [ ] **Map Container**
    - A div placeholder for the ArcGIS map view.

## Phase 3: Map Implementation (ArcGIS JS API)
- [ ] **Map Component**
    - Initialize `Map` and `MapView` in a custom hook or component.
    - Set default extent to Abu Dhabi.
- [ ] **Layer Management**
    - [ ] Implement a `LayerManager` to handle visibility.
    - [ ] **Mock Services**: Since we currently have CSVs, create "Client-side Feature Layers" using the CSV data (converted to GeoJSON or loaded directly into FeatureLayer source) to simulate the ArcGIS Services.
    - [ ] Load `COMMUNITY`, `DISTRICT`, `PROJECT`, `PLOT` as FeatureLayers.
- [ ] **Map Control Hooks**
    - Create functions exposed to the app: `zoomToFeature(geometry)`, `highlightFeature(oid)`, `setLayerVisibility(layerId, visible)`.

## Phase 4: Data Services & Backend
- [ ] **Data Ingestion**
    - [ ] Place the provided CSV files in `public/data` or `lib/data`.
    - [ ] Write a utility to parse CSVs into JSON objects for querying.
- [ ] **Query Logic (The "Brain")**
    - Create a set of helper functions to answer the specific business questions (Sales, Rental, Supply).
    - *Example*: `getSalesVolume(district, year)`, `getAverageRent(community, type)`.
    - These functions will act as the "Tools" for the AI agent.

## Phase 5: AI Agent Integration (Gemini)
- [ ] **API Route Setup**
    - Create `app/api/chat/route.ts`.
    - Configure Google Generative AI client.
- [ ] **Tool Definition**
    - Define tools using the Vercel AI SDK `tool` format:
        - `query_sales_data`: For answering descriptive/comparative sales questions.
        - `query_rental_data`: For rental questions.
        - `query_supply_data`: For supply questions.
        - `control_map`: For zooming, panning, toggling layers.
        - `show_visualization`: For triggering the bottom panel to show tables/charts.
- [ ] **System Prompt Engineering**
    - Write a robust system prompt that explains the context (Abu Dhabi Real Estate), the available data, and the rules for answering (Descriptive vs Comparative).

## Phase 6: UI Integration & Interactivity
- [ ] **Chat-to-Map Interaction**
    - When AI answers "Show me Yas Island", trigger the map zoom tool.
    - When AI answers "Here are the sales...", highlight the relevant districts/communities on the map.
- [ ] **Chat-to-Table Interaction**
    - When AI returns tabular data, render it in the Bottom Panel.
- [ ] **Chat-to-Chart Interaction**
    - When AI returns trend data (e.g., "Sales prices year-on-year"), render a Line/Bar chart in the Bottom Panel.

## Phase 7: Specific Use Case Implementation (The "Sample Questions")
- [ ] **Sales Data Implementation**
    - [ ] Implement logic for "Total sales value/volume".
    - [ ] Implement logic for "Average price per sqm".
    - [ ] Implement logic for "Highest number of sales".
- [ ] **Rental Data Implementation**
    - [ ] Implement logic for "Average annual rent".
    - [ ] Implement logic for "Budget search".
- [ ] **Supply Data Implementation**
    - [ ] Implement logic for "Current housing supply".
    - [ ] Implement logic for "Future supply comparison".

## Phase 8: Testing & Refinement
- [ ] **End-to-End Testing**
    - Test each sample question from the user's list.
    - Verify map interactions work correctly.
    - Verify charts render correctly.
- [ ] **UI Polish**
    - Ensure styling matches a professional "Smart Assistant" look.
    - Add loading states for AI responses.

