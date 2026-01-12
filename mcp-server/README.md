# Real Estate MCP Server

MCP (Model Context Protocol) server for querying real estate data.

## Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start

# Development (with watch)
npm run watch
```

## Test

After building, test the server:

```bash
npm start
```

The server runs on stdio and waits for MCP client connections.

## Current Status

- ✅ Step 1: Basic MCP server structure created
- ⏳ Step 2: CSV data loader (next)
