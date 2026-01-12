import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server...\n');

  // Create MCP client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Connect to the server
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  await client.connect(transport);
  console.log('✅ Connected to MCP server\n');

  // List available tools
  const tools = await client.listTools();
  console.log('📋 Available tools:');
  tools.tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log();

  // Test the connection tool
  console.log('🔧 Testing tool: test_connection');
  const result = await client.callTool({
    name: 'test_connection',
    arguments: {
      message: 'Hello from test client!',
    },
  });

  console.log('📤 Response:', result.content[0]);
  console.log();

  // Test get_districts
  console.log('🔧 Testing tool: get_districts');
  const districtsResult = await client.callTool({
    name: 'get_districts',
    arguments: {},
  });

  console.log('📤 Response:', districtsResult.content[0].text.substring(0, 200) + '...');
  console.log();

  // Test get_communities with filter
  console.log('🔧 Testing tool: get_communities (YAS ISLAND)');
  const communitiesResult = await client.callTool({
    name: 'get_communities',
    arguments: {
      district: 'YAS ISLAND',
    },
  });

  console.log('📤 Response:', communitiesResult.content[0].text.substring(0, 300) + '...');
  console.log('\n✅ All tests passed!');

  await client.close();
  process.exit(0);
}

testMCPServer().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
