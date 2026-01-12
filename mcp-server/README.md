# Real Estate MCP Server

MCP (Model Context Protocol) server for querying real estate data from ArcGIS REST API.

## Features

✅ **Step 1 Complete**: Basic MCP server structure  
✅ **Step 2 Complete**: ArcGIS REST API client with geometry support

### Data Sources
- **ArcGIS REST API**: `https://localhost:6443/arcgis/rest/services/RealStates/MapServer`
- **19 Layers**: Districts, Communities, Projects, Sales, Rentals, Supply data
- **Geometry Support**: Returns spatial data for map visualization and spatial queries

### Available Tools
- `test_connection`: Test server connectivity
- `get_districts`: Query all districts  
- `get_communities`: Query communities by district (with optional filter)

### Geometry Capabilities
The data loader supports:
- ✅ Returning geometry with attribute data
- ✅ Spatial queries (extent-based filtering)
- ✅ District/project boundaries for map display
- ✅ Location queries for zoom/highlight operations

## Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Test
node test.mjs
```

## Current Status

- ✅ Step 1: Basic MCP server structure
- ✅ Step 2: ArcGIS REST API client with geometry
- ⏳ Step 3: Query layer for sales/rental/supply data (next)

## Next Steps

1. Add sales query tools
2. Add rental query tools  
3. Add supply query tools
4. Integrate with chat API
