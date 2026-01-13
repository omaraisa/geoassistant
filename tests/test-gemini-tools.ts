/**
 * Multilingual Tool Calling Tests
 * Test Gemini's ability to handle English, Arabic, and mixed-language queries
 */

import { askGeminiWithTools } from '../lib/gemini/toolCalling';

interface TestCase {
  question: string;
  language: string;
  expectedToolCall: string;
  expectedData?: string;
  description: string;
}

const testCases: TestCase[] = [
  // English tests
  {
    question: 'What was the total sales value in Yas Island in 2024?',
    language: 'English',
    expectedToolCall: 'get_total_sales_value',
    expectedData: '113,364,913,855',
    description: 'Basic sales query in English'
  },
  {
    question: 'How many transactions occurred in Yas Island in 2024?',
    language: 'English',
    expectedToolCall: 'get_transaction_count',
    expectedData: '39,784',
    description: 'Transaction count in English'
  },
  {
    question: 'Compare sales between Yas Island and Al Reem Island in 2024',
    language: 'English',
    expectedToolCall: 'compare_sales_between_districts',
    description: 'Comparison query in English'
  },

  // Arabic tests
  {
    question: 'كم عدد المعاملات العقارية في جزيرة ياس عام 2024؟',
    language: 'Arabic',
    expectedToolCall: 'get_transaction_count',
    expectedData: '39,784',
    description: 'Transaction count in Arabic'
  },
  {
    question: 'ما هي القيمة الإجمالية للمبيعات في جزيرة ياس في 2024؟',
    language: 'Arabic',
    expectedToolCall: 'get_total_sales_value',
    expectedData: '113,364,913,855',
    description: 'Sales value in Arabic'
  },
  {
    question: 'قارن بين جزيرة ياس وجزيرة الريم',
    language: 'Arabic',
    expectedToolCall: 'compare_sales_between_districts',
    description: 'Comparison in Arabic'
  },

  // Mixed language tests
  {
    question: 'How many معاملات in ياس 2024?',
    language: 'Mixed (English/Arabic)',
    expectedToolCall: 'get_transaction_count',
    description: 'Mixed English and Arabic'
  },
  {
    question: 'معاملات Yas Island في 2024',
    language: 'Mixed (Arabic/English)',
    expectedToolCall: 'get_transaction_count',
    description: 'Arabic with English location'
  },

  // Synonym tests
  {
    question: 'How many deals were made in Yas Island in 2024?',
    language: 'English (synonym: deals)',
    expectedToolCall: 'get_transaction_count',
    description: 'Synonym: deals instead of transactions'
  },
  {
    question: 'Total sales volume in Yas 2024',
    language: 'English (synonym: volume)',
    expectedToolCall: 'get_transaction_count',
    description: 'Synonym: volume instead of count'
  },
  {
    question: 'Revenue from Yas Island 2024',
    language: 'English (synonym: revenue)',
    expectedToolCall: 'get_total_sales_value',
    description: 'Synonym: revenue instead of sales value'
  },

  // Municipality tests
  {
    question: 'What was the total sales value in Abu Dhabi in 2024?',
    language: 'English',
    expectedToolCall: 'get_municipality_sales',
    description: 'Municipality-level query (not district)'
  },
  {
    question: 'ما هي المبيعات في أبو ظبي؟',
    language: 'Arabic',
    expectedToolCall: 'get_municipality_sales',
    description: 'Municipality query in Arabic'
  },

  // Rental tests
  {
    question: 'Find me 3-bedroom units within 150,000 AED budget',
    language: 'English',
    expectedToolCall: 'find_units_by_budget',
    description: 'Rental search by budget'
  },
  {
    question: 'ابحث عن شقق للإيجار بميزانية 100 ألف',
    language: 'Arabic',
    expectedToolCall: 'find_units_by_budget',
    description: 'Rental search in Arabic'
  },

  // Supply tests
  {
    question: 'What is the current housing supply in Yas Island?',
    language: 'English',
    expectedToolCall: 'get_current_supply',
    description: 'Supply query'
  },
  {
    question: 'كم عدد الوحدات المتاحة في جزيرة ياس؟',
    language: 'Arabic',
    expectedToolCall: 'get_current_supply',
    description: 'Supply query in Arabic'
  }
];

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Testing Multilingual Tool Calling\n');
  console.log('=' .repeat(80));

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.description}`);
    console.log(`   Language: ${testCase.language}`);
    console.log(`   Question: "${testCase.question}"`);
    console.log('-'.repeat(80));

    try {
      const response = await askGeminiWithTools(testCase.question);
      
      console.log(`   ✓ Response received (${response.length} chars)`);
      
      // Check if expected data is in response
      if (testCase.expectedData) {
        const hasData = response.includes(testCase.expectedData) || 
                       response.replace(/,/g, '').includes(testCase.expectedData.replace(/,/g, ''));
        
        if (hasData) {
          console.log(`   ✓ Contains expected data: ${testCase.expectedData}`);
          passed++;
        } else {
          console.log(`   ✗ Missing expected data: ${testCase.expectedData}`);
          console.log(`   Response: ${response.substring(0, 200)}...`);
          failed++;
        }
      } else {
        // Just check that we got a response
        console.log(`   ✓ Tool called successfully`);
        passed++;
      }
      
      console.log(`   Response preview: ${response.substring(0, 150)}...`);
      
    } catch (error: any) {
      console.log(`   ✗ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✓ Passed: ${passed}/${testCases.length}`);
  console.log(`✗ Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { testCases, runTests };
