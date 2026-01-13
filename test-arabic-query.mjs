/**
 * Quick test for Arabic query support
 * Tests the new tool calling implementation
 */

async function testArabicQuery() {
  const testCases = [
    {
      name: 'English: Yas Island transactions',
      message: 'How many transactions occurred in Yas Island in 2024?',
      expectedData: '39,784'
    },
    {
      name: 'Arabic: Yas Island transactions',
      message: 'كم عدد المعاملات العقارية في جزيرة ياس عام 2024؟',
      expectedData: '39,784'
    },
    {
      name: 'English: Yas Island sales value',
      message: 'What was the total sales value in Yas Island in 2024?',
      expectedData: '113'
    },
    {
      name: 'Mixed: معاملات in Yas 2024',
      message: 'How many معاملات in Yas Island 2024?',
      expectedData: '39,784'
    }
  ];

  console.log('🧪 Testing Multilingual Tool Calling\n');
  console.log('=' .repeat(80));

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`Question: "${testCase.message}"`);
    console.log('-'.repeat(80));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✓ Response: ${data.response.substring(0, 200)}...`);
      
      if (data.response.includes(testCase.expectedData)) {
        console.log(`✓ Contains expected data: ${testCase.expectedData}`);
      } else {
        console.log(`⚠ Missing expected data: ${testCase.expectedData}`);
      }
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Test complete!');
}

testArabicQuery().catch(console.error);
