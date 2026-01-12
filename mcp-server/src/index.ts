#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { arcgisClient } from './dataLoader.js';

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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
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
