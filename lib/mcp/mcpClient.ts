/**
 * MCP Client for Next.js API
 * Communicates with the MCP server to execute real estate queries
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';

export class RealEstateMCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    // Create client
    this.client = new Client(
      {
        name: 'real-estate-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Create transport
    // Use absolute path to ensure correct location
    const mcpServerPath = require('path').resolve(process.cwd(), 'mcp-server', 'dist', 'index.js');
    console.log('[MCP Client] MCP server path:', mcpServerPath);
    
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [mcpServerPath],
    });

    // Connect
    await this.client.connect(this.transport);
    console.log('[MCP Client] Connected to Real Estate MCP Server');
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    if (!this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    return result;
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any> {
    if (!this.client) {
      throw new Error('MCP client not connected. Call connect() first.');
    }

    return await this.client.listTools();
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
    }
  }
}

// Singleton instance
let mcpClientInstance: RealEstateMCPClient | null = null;

/**
 * Get or create the MCP client instance
 */
export async function getMCPClient(): Promise<RealEstateMCPClient> {
  if (!mcpClientInstance) {
    mcpClientInstance = new RealEstateMCPClient();
    await mcpClientInstance.connect();
  }
  return mcpClientInstance;
}

/**
 * Execute a real estate query through MCP
 */
export async function executeQuery(
  tool: string,
  params: Record<string, any>
): Promise<string> {
  const client = await getMCPClient();
  const result = await client.callTool(tool, params);

  if (result.content && result.content[0]) {
    return result.content[0].text || JSON.stringify(result);
  }

  return 'No response from MCP server';
}
