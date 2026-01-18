
# 🏠 Real Estate Smart Assistant

A next-generation AI-powered real estate analytics and visualization platform for Abu Dhabi, UAE. This project combines conversational AI, interactive mapping, and data-driven insights to help users explore, compare, and analyze real estate trends at the project (building/complex) level.

## 🚀 What This Project Does
- **Conversational AI**: Users can ask questions in English or Arabic about sales, rentals, supply, and more. The AI understands both languages and can handle mixed-language conversations.
- **Interactive Map**: Visualizes search results on a map using ArcGIS JS API, with project-level granularity. Clicking a table row zooms and highlights the corresponding project on the map.
- **Data Visualization**: Auto-generates tables and charts for comparisons and trends.
- **Project-Level Focus**: All rental and supply queries are answered at the project (not plot or district) level, ensuring actionable, granular insights.

## 📂 Data Sources: CSV Files
The system uses a rich set of CSV files (see `/Tables` and `/public/data`) as the authoritative source for map layers and analytics:
- **COMMUNITY.csv, DISTRICT.csv, MUNICIPALITY.csv**: Geographical boundaries and metadata.
- **PROJECT.csv, PLOT.csv**: Project and plot definitions (project = building/complex).
- **RENTAL_INDEX_PROJECT.csv, RENTAL_INDEX_DISTRICT.csv, RENTAL_INDEX_COMMUNITY.csv**: Rental statistics at project, district, and community levels.
- **SALE_RATES_PROJECT.csv, SALE_RATES_DISTRICT.csv**: Sales price data.
- **SUPPLY_PROJECT.csv, SUPPLY_DISTRICT.csv, SUPPLY_COMMUNITY.csv, SUPPLY_PLOT.csv**: Housing supply by geography and granularity.
- **TRANSACTIONS_PROJECT.csv, TRANSACTIONS_DISTRICT.csv**: Transaction records.
- **schema.ini**: Data schema for parsing.

**Agent Tip:** Reviewing these CSVs gives you a direct understanding of what each map layer represents, the available fields, and how queries are answered. This is essential for debugging, extending, or building new analytics tools.

## 🛠️ Achievements
- End-to-end conversational AI with Gemini 2.5 Flash and custom MCP server
- Project-level rental search and visualization ("Find me projects with 3BR units within a budget of AED 100,000")
- Interactive map with project outlines, LayerList, and table-to-map linking
- Robust geometry and spatial reference handling (WGS84, autocast)
- Table and chart auto-generation for all queries
- Multilingual support (English/Arabic, mixed)
- All user-facing prompts, popups, and tables reference project names for clarity
- Cleaned up debug logs and dev-only code

## 🧭 What Remains / Next Steps
- Add rental and supply comparison tools ("Compare supply between projects")
- Enhance popup content with richer project metadata (e.g., developer, year built)
- Add user authentication and saved searches
- Integrate live data update pipeline (from CSVs or external APIs)
- Improve error handling and user feedback for ambiguous queries
- Expand charting options (time series, heatmaps)
- Polish UI/UX for production

## 🤝 For Agents & Developers
- **Understand the Data**: The CSVs are your map layer source-of-truth. Use them to validate queries, debug results, or extend the system.
- **Extend the Platform**: Add new tools, analytics, or visualizations by leveraging the existing data structure and AI tool-calling framework.
- **Contribute**: PRs and feedback are welcome!

---

*Built with Next.js, TypeScript, ArcGIS JS API, Gemini 2.5 Flash, and a custom MCP server.*
