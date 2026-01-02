# Real Estate Smart Assistant POC - Development Plan

This plan outlines the steps to build a Next.js-based GeoAI agent application. The app features an ArcGIS map, an AI assistant sidebar (Gemini), and data visualization tools (tables, charts).

## Phase 1: Project Initialization & Setup
- [x] **Initialize Next.js Project**
    - Create a new Next.js app with TypeScript and Tailwind CSS.
    - `npx create-next-app@latest . --typescript --tailwind --eslint`
- [x] **Install Dependencies**
    - [x] ArcGIS Maps SDK: `@arcgis/core`
    - [x] AI Integration: `ai` (Vercel AI SDK), `@google/generative-ai`
    - [x] UI Components: `lucide-react`, `clsx`, `tailwind-merge` (or shadcn/ui)
    - [x] Charts: `recharts` or `chart.js`
    - [x] Data Parsing: `papaparse` (for loading the CSVs provided)
- [x] **Project Structure Setup**
    - Define folders: `components/map`, `components/ui`, `components/chat`, `lib/data`, `lib/arcgis`, `app/api/chat`.

## Phase 2: Core UI Layout & Components
- [x] **Main Layout Shell**
    - Create a responsive layout with a fixed Sidebar (Left), Map Area (Center/Right), and Collapsible Bottom Panel.
- [x] **Sidebar Component**
    - Chat interface container.
    - Input field and message history display.
- [x] **Bottom Panel Component**
    - Tabbed interface for "Attribute Table" and "Charts".
    - Visibility toggle (hidden by default, opens when AI returns data).
- [x] **Map Container**
    - A div placeholder for the ArcGIS map view.

## Phase 3: Map Implementation (ArcGIS JS API)
- [x] **Map Component**
    - Initialize `Map` and `MapView` in a custom hook or component.
    - Set default extent to Abu Dhabi.
- [x] **Layer Management**
    - [x] Implement a `LayerManager` to handle visibility.
    - [x] **Mock Services**: Since we currently have CSVs, create "Client-side Feature Layers" using the CSV data (converted to GeoJSON or loaded directly into FeatureLayer source) to simulate the ArcGIS Services.
    - [x] Load `COMMUNITY`, `DISTRICT`, `PROJECT`, `PLOT` as FeatureLayers.
- [x] **Map Control Hooks**
    - Create functions exposed to the app: `zoomToFeature(geometry)`, `highlightFeature(oid)`, `setLayerVisibility(layerId, visible)`.

## Phase 4: Data Services & Backend
- [x] **Data Ingestion**
    - [x] Place the provided CSV files in `public/data` or `lib/data`.
    - [x] Write a utility to parse CSVs into JSON objects for querying.
- [x] **Query Logic (The "Brain")**
    - Create a set of helper functions to answer the specific business questions (Sales, Rental, Supply).
    - *Example*: `getSalesVolume(district, year)`, `getAverageRent(community, type)`.
    - These functions will act as the "Tools" for the AI agent.

## Phase 5: AI Agent Integration (Gemini)
- [x] **API Route Setup**
    - Create `app/api/chat/route.ts`.
    - Configure Google Generative AI client.
- [x] **Tool Definition**
    - Define tools using the Vercel AI SDK `tool` format:
        - `query_sales_data`: For answering descriptive/comparative sales questions.
        - `query_rental_data`: For rental questions.
        - `query_supply_data`: For supply questions.
        - `control_map`: For zooming, panning, toggling layers.
        - `show_visualization`: For triggering the bottom panel to show tables/charts.
- [x] **System Prompt Engineering**
    - Write a robust system prompt that explains the context (Abu Dhabi Real Estate), the available data, and the rules for answering (Descriptive vs Comparative).

## Phase 6: UI Integration & Interactivity
- [x] **Chat-to-Map Interaction**
    - When AI answers "Show me Yas Island", trigger the map zoom tool.
    - When AI answers "Here are the sales...", highlight the relevant districts/communities on the map.
- [x] **Chat-to-Table Interaction**
    - When AI returns tabular data, render it in the Bottom Panel.
- [x] **Chat-to-Chart Interaction**
    - When AI returns trend data (e.g., "Sales prices year-on-year"), render a Line/Bar chart in the Bottom Panel.

## Phase 7: Specific Use Case Implementation (The "Sample Questions")
- [x] **Sales Data Implementation**
    - [x] Implement logic for "Total sales value/volume".
    - [x] Implement logic for "Average price per sqm".
    - [x] Implement logic for "Highest number of sales".
- [x] **Rental Data Implementation**
    - [x] Implement logic for "Average annual rent".
    - [x] Implement logic for "Budget search".
- [x] **Supply Data Implementation**
    - [x] Implement logic for "Current housing supply".
    - [x] Implement logic for "Future supply comparison".

## Phase 8: Testing & Refinement
- [x] **End-to-End Testing**
    - Test each sample question from the user's list.
    - Verify map interactions work correctly.
    - Verify charts render correctly.
- [ ] **UI Polish**
    - Ensure styling matches a professional "Smart Assistant" look.
    - Add loading states for AI responses.

