/**
 * Test Natural Language Understanding and MCP Integration
 */

import { parseQuery } from '../lib/nlu/queryParser';

// Test queries
const testQueries = [
  'What was the total sales value in Yas Island in 2024?',
  'How many transactions were there in Al Reem Island in 2024?',
  'Compare sales between Yas Island and Al Reem Island in 2024',
  'Find 3-bedroom units within 150k AED budget',
  'What is the current housing supply in Yas Island for 2024?',
  'Show me rental units for 100000 AED with 2 beds',
  'What are the transaction counts for Yas 2024?',
  'Get supply information for Al Reem',
];

console.log('🧪 Testing NLU Query Parser\n');
console.log('=' .repeat(80));

testQueries.forEach((query, index) => {
  console.log(`\n${index + 1}. Query: "${query}"`);
  console.log('-'.repeat(80));
  
  const parsed = parseQuery(query);
  
  if (parsed) {
    console.log('✅ Parsed successfully!');
    console.log(`   Intent: ${parsed.intent}`);
    console.log(`   Tool: ${parsed.tool}`);
    console.log(`   Confidence: ${(parsed.confidence * 100).toFixed(0)}%`);
    console.log(`   Entities:`, JSON.stringify(parsed.entities, null, 6));
  } else {
    console.log('❌ Could not parse query');
  }
});

console.log('\n' + '='.repeat(80));
console.log('✅ NLU Test Complete\n');
