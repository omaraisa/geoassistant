#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { arcgisClient } from './dataLoader.js';
import { searchGeospatialMetadata } from './discovery/searchTool.js';
import * as salesQueries from './queries/salesQueries.js';
import * as rentalQueries from './queries/rentalQueries.js';
import * as supplyQueries from './queries/supplyQueries.js';
import * as municipalityQueries from './queries/municipalityQueries.js';

/**
 * Real Estate MCP Server
 * Provides tools to query sales, rental, and supply data
 */
class RealEstateMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'real-estate-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'test_connection',
            description: 'Test if the MCP server is working',
            inputSchema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'A test message',
                },
              },
            },
          },
          {
            name: 'search_geospatial_metadata',
            description: 'Search for entities (districts, projects) in the GIS system. Use this FIRST when user mentions a location.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search text (e.g. "Yas Island", "جزيرة ياس", "Reem")',
                }
              },
              required: ['query'],
            },
          },
          {
            name: 'get_districts',
            description: 'Get list of all districts in Abu Dhabi from ArcGIS REST API',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_communities',
            description: 'Get list of communities by district from ArcGIS REST API',
            inputSchema: {
              type: 'object',
              properties: {
                district: {
                  type: 'string',
                  description: 'District name (e.g., "YAS ISLAND", "AL REEM ISLAND")',
                },
              },
            },
          },
          {
            name: 'get_total_sales_value',
            description: 'Get total sales value and volume for a district/year',
            inputSchema: {
              type: 'object',
              properties: {
                district: { type: 'string', description: 'District name' },
                year: { type: 'number', description: 'Year (e.g., 2024)' },
                typology: { type: 'string', description: 'Property type (optional)' },
                layout: { type: 'string', description: 'Bedroom layout (optional, e.g., "3 beds")' },
              },
              required: ['district'],
            },
          },
          {
            name: 'get_transaction_count',
            description: 'Get number of transactions in a district/year',
            inputSchema: {
              type: 'object',
              properties: {
                district: { type: 'string', description: 'District name' },
                year: { type: 'number', description: 'Year' },
              },
              required: ['district', 'year'],
            },
          },
          {
            name: 'compare_sales_between_districts',
            description: 'Compare sales data between two districts',
            inputSchema: {
              type: 'object',
              properties: {
                district1: { type: 'string', description: 'First district name' },
                district2: { type: 'string', description: 'Second district name' },
                year: { type: 'number', description: 'Year (optional)' },
              },
              required: ['district1', 'district2'],
            },
          },
          {
            name: 'compare_rental_prices',
            description: 'Compares rental prices/index between multiple districts, projects, or communities',
            inputSchema: {
              type: 'object',
              properties: {
                entities: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of names to compare'
                },
                entityType: {
                  type: 'string',
                  enum: ['district', 'project', 'community'],
                  description: 'Type of entities being compared'
                },
                year: { type: 'number', description: 'Year (optional)' },
                typology: { type: 'string', description: 'Property type (optional)' },
                layout: { type: 'string', description: 'Layout (optional)' },
              },
              required: ['entities', 'entityType'],
            },
          },
          {
            name: 'find_units_by_budget',
            description: 'Find real estate projects (buildings/complexes) with rental units within a budget at the project level',
            inputSchema: {
              type: 'object',
              properties: {
                budget: { type: 'number', description: 'Maximum budget in AED' },
                layout: { type: 'string', description: 'Bedroom layout (e.g., "3 beds")' },
                year: { type: 'number', description: 'Year (optional)' },
              },
              required: ['budget', 'layout'],
            },
          },
          {
            name: 'get_current_supply',
            description: 'Get current housing supply for a district',
            inputSchema: {
              type: 'object',
              properties: {
                district: { type: 'string', description: 'District name' },
                year: { type: 'number', description: 'Year' },
                layout: { type: 'string', description: 'Bedroom layout (optional)' },
              },
              required: ['district', 'year'],
            },
          },
          {
            name: 'get_municipality_sales',
            description: 'Get total sales data for an entire municipality (Abu Dhabi City, Al Ain City, or Al Dhafra Region) - aggregates all districts',
            inputSchema: {
              type: 'object',
              properties: {
                municipality: {
                  type: 'string',
                  description: 'Municipality name (e.g., "Abu Dhabi City", "Al Ain City")'
                },
                year: { type: 'number', description: 'Year (optional)' },
              },
              required: ['municipality'],
            },
          },
          {
            name: 'get_top_districts_in_municipality',
            description: 'Get top districts by sales value within a municipality',
            inputSchema: {
              type: 'object',
              properties: {
                municipality: { type: 'string', description: 'Municipality name' },
                year: { type: 'number', description: 'Year' },
                limit: { type: 'number', description: 'Number of top districts to return (default 5)' },
              },
              required: ['municipality', 'year'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'search_geospatial_metadata') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  await searchGeospatialMetadata(args as any),
                  null,
                  2
                ),
              },
            ],
          };
        }

        if (name === 'test_connection') {
          const message = (args as { message?: string })?.message || 'Hello';
          return {
            content: [
              {
                type: 'text',
                text: `✅ MCP Server is working! You said: "${message}"`,
              },
            ],
          };
        }

        if (name === 'get_districts') {
          const districts = await arcgisClient.getDistricts();
          const districtList = districts.map((d: any) => ({
            id: d.district_id,
            name: d.name_en,
            municipality: d.municipality_name,
          }));

          return {
            content: [
              {
                type: 'text',
                text: `Found ${districts.length} districts:\n${JSON.stringify(districtList, null, 2)}`,
              },
            ],
          };
        }

        if (name === 'get_communities') {
          const district = (args as { district?: string })?.district;

          let where = '1=1';
          if (district) {
            where = `UPPER(district_name) = '${district.toUpperCase()}'`;
          }

          const communities = await arcgisClient.getCommunities(where);
          const communityList = communities.map((c: any) => ({
            id: c.community_id,
            name: c.name_en,
            district: c.district_name,
          }));

          return {
            content: [
              {
                type: 'text',
                text: `Found ${communities.length} communities${district ? ` in ${district}` : ''}:\n${JSON.stringify(communityList.slice(0, 10), null, 2)}${communities.length > 10 ? `\n... and ${communities.length - 10} more` : ''}`,
              },
            ],
          };
        }

        if (name === 'get_total_sales_value') {
          const { district, year, typology, layout } = args as any;
          const result = await salesQueries.getTotalSalesValue({ district, year, typology, layout });

          return {
            content: [
              {
                type: 'text',
                text: `Sales Data for ${district}${year ? ` in ${year}` : ''}:\n` +
                  `Total Value: AED ${result.totalValue.toLocaleString()}\n` +
                  `Total Volume: ${result.totalVolume.toLocaleString()} transactions\n` +
                  `Average Price: AED ${result.totalVolume > 0 ? Math.round(result.totalValue / result.totalVolume).toLocaleString() : 0}`,
              },
            ],
          };
        }

        if (name === 'get_transaction_count') {
          const { district, year } = args as any;
          const result = await salesQueries.getTransactionCount({ district, year });

          return {
            content: [
              {
                type: 'text',
                text: `Transactions in ${district} for ${year}:\n` +
                  `Total: ${result.totalTransactions.toLocaleString()} transactions\n` +
                  `Data records: ${result.recordCount}`,
              },
            ],
          };
        }

        if (name === 'compare_sales_between_districts') {
          const { district1, district2, year } = args as any;
          const result = await salesQueries.compareSalesBetweenDistricts(district1, district2, year);

          return {
            content: [
              {
                type: 'text',
                text: `Sales Comparison${year ? ` for ${year}` : ''}:\n\n` +
                  `${district1}:\n` +
                  `  Value: AED ${result.district1.totalValue.toLocaleString()}\n` +
                  `  Volume: ${result.district1.totalVolume.toLocaleString()} transactions\n\n` +
                  `${district2}:\n` +
                  `  Value: AED ${result.district2.totalValue.toLocaleString()}\n` +
                  `  Volume: ${result.district2.totalVolume.toLocaleString()} transactions\n\n` +
                  `Difference:\n` +
                  `  ${district1} has ${result.comparison.valuePercentDiff > 0 ? 'higher' : 'lower'} sales by ${Math.abs(result.comparison.valuePercentDiff).toFixed(1)}%`,
              },
              {
                type: 'resource',
                resource: {
                  uri: `data:application/json,${encodeURIComponent(JSON.stringify(result))}`,
                  mimeType: 'application/json',
                  text: JSON.stringify(result)
                }
              }
            ],
          };
        }

        if (name === 'compare_rental_prices') {
          const { entities, entityType, year, typology, layout } = args as any;
          const result = await rentalQueries.compareRentalValues(entities, entityType, year, typology, layout);

          return {
            content: [
              {
                type: 'text',
                text: result.comparison,
              },
              {
                type: 'resource',
                resource: {
                  uri: `data:application/json,${encodeURIComponent(JSON.stringify(result))}`,
                  mimeType: 'application/json',
                  text: JSON.stringify(result)
                }
              }
            ],
          };
        }

        if (name === 'find_units_by_budget') {
          const { budget, layout, year } = args as any;
          const result = await rentalQueries.findUnitsByBudget(budget, layout, year);

          const districts = result.results.map(r => `${r.district} (avg: AED ${Math.round(r.avgRent).toLocaleString()})`);

          return {
            content: [
              {
                type: 'text',
                text: `Units within AED ${budget.toLocaleString()} budget for ${layout}:\n\n` +
                  `Found ${result.count} options:\n` +
                  districts.slice(0, 10).join('\n') +
                  (districts.length > 10 ? `\n... and ${districts.length - 10} more` : ''),
              },
              {
                type: 'resource',
                resource: {
                  uri: `data:application/json,${encodeURIComponent(JSON.stringify({ results: result.results, features: result.features }))}`,
                  mimeType: 'application/json',
                  text: JSON.stringify({ results: result.results, features: result.features })
                }
              }
            ],
          };
        }

        if (name === 'get_current_supply') {
          const { district, year, layout } = args as any;
          const result = await supplyQueries.getCurrentSupplyByCommunity({ district, year, layout });

          return {
            content: [
              {
                type: 'text',
                text: `Supply in ${district} for ${year}:\n` +
                  `Total Units: ${result.totalSupply.toLocaleString()}\n` +
                  `Breakdown:\n` +
                  result.results.slice(0, 5).map(r =>
                    `  ${r.layout || 'All'} (${r.typology}): ${r.totalSupply.toLocaleString()} units`
                  ).join('\n') +
                  (result.results.length > 5 ? `\n... and ${result.results.length - 5} more categories` : ''),
              },
            ],
          };
        }

        if (name === 'get_municipality_sales') {
          const { municipality, year } = args as any;
          const result = await municipalityQueries.getTotalSalesByMunicipality(municipality, year);

          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        if (name === 'get_top_districts_in_municipality') {
          const { municipality, year, limit } = args as any;
          const result = await municipalityQueries.getTopDistrictsByMunicipality(municipality, year, limit || 5);

          return {
            content: [
              {
                type: 'text',
                text: result.text,
              },
              {
                type: 'resource',
                resource: {
                  uri: `data:application/json,${encodeURIComponent(JSON.stringify(result.data))}`,
                  mimeType: 'application/json',
                  text: JSON.stringify(result.data)
                }
              }
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Real Estate MCP Server running on stdio');
  }
}

// Start the server
const server = new RealEstateMCPServer();
server.run().catch(console.error);
