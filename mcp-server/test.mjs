import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('🧪 Testing MCP Server - Sales, Rental & Supply Queries...\n');

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

  // Test 1: Get total sales value for Yas Island in 2024
  console.log('🔧 Test 1: Getting total sales value for Yas Island 2024...');
  const result1 = await client.callTool({
    name: 'get_total_sales_value',
    arguments: { district: 'YAS ISLAND', year: 2024 },
  });
  console.log('📤 Response:', result1.content[0].text);
  console.log();

  // Test 2: Get transaction count
  console.log('🔧 Test 2: Getting transaction count for Yas Island 2024...');
  const result2 = await client.callTool({
    name: 'get_transaction_count',
    arguments: { district: 'YAS ISLAND', year: 2024 },
  });
  console.log('📤 Response:', result2.content[0].text);
  console.log();

  // Test 3: Compare sales between districts
  console.log('🔧 Test 3: Comparing sales between Yas Island and Al Reem Island...');
  const result3 = await client.callTool({
    name: 'compare_sales_between_districts',
    arguments: { district1: 'YAS ISLAND', district2: 'AL REEM ISLAND', year: 2024 },
  });
  console.log('📤 Response:', result3.content[0].text);
  console.log();

  // Test 4: Find rental units by budget
  console.log('🔧 Test 4: Finding rental units under AED 100,000 for 3 beds...');
  const result4 = await client.callTool({
    name: 'find_units_by_budget',
    arguments: { budget: 100000, layout: '3 beds', year: 2024 },
  });
  console.log('📤 Response:', result4.content[0].text);
  console.log();

  // Test 5: Get current supply
  console.log('🔧 Test 5: Getting current supply for Yas Island 2024...');
  const result5 = await client.callTool({
    name: 'get_current_supply',
    arguments: { district: 'YAS ISLAND', year: 2024 },
  });
  console.log('📤 Response:', result5.content[0].text);
  console.log();

  console.log('\n✅ All tests passed!');

  await client.close();
  process.exit(0);
}

testMCPServer().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

