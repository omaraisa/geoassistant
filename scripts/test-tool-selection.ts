#!/usr/bin/env node
/**
 * Interactive test script for tool selection
 * 
 * Run: npx tsx scripts/test-tool-selection.ts
 */

import { selectToolsForMessage } from '../lib/tool-rag/retriever';

const testQueries = [
  {
    category: 'Arabic - Transactions',
    queries: [
      'كم عدد المعاملات في جزيرة ياس في 2023؟',
      'عدد الصفقات في الريم',
      'معاملات السعديات ٢٠٢٤',
    ],
  },
  {
    category: 'Arabic - Sales Value',
    queries: [
      'ما هي إجمالي قيمة المبيعات في أبو ظبي؟',
      'قيمة المبيعات في جزيرة ياس',
      'إجمالي المبيعات',
    ],
  },
  {
    category: 'Arabic - Rentals',
    queries: [
      'ابحث عن شقة غرفتين للإيجار بميزانية 120000',
      'إيجار شقة في أبو ظبي',
      'وحدات للاستئجار',
    ],
  },
  {
    category: 'Arabic - Supply',
    queries: [
      'كم عدد الوحدات المتاحة في خليفة سيتي؟',
      'العرض المتاح',
      'الوحدات السكنية المتوفرة',
    ],
  },
  {
    category: 'English - Transactions',
    queries: [
      'How many transactions in Yas Island in 2024?',
      'Transaction count for Al Reem',
      'Number of sales in Saadiyat',
    ],
  },
  {
    category: 'English - Sales Value',
    queries: [
      'What was the total sales value in Saadiyat Island in 2023?',
      'Sales amount in Yas Island',
      'Total revenue Abu Dhabi City',
    ],
  },
  {
    category: 'English - Rentals',
    queries: [
      'Find me a 2-bedroom apartment to rent for 120,000 AED',
      'Rental units under 100k',
      'Apartments for lease',
    ],
  },
  {
    category: 'English - Supply',
    queries: [
      'What is the current housing supply in Khalifa City?',
      'Available units in Reem Island',
      'Housing inventory',
    ],
  },
  {
    category: 'Comparisons',
    queries: [
      'Compare sales between Yas Island and Reem Island',
      'قارن المبيعات بين جزيرة السعديات و جزيرة ياس',
      'Which district performed better?',
    ],
  },
  {
    category: 'Municipality',
    queries: [
      'Show me total sales in Abu Dhabi City for 2023',
      'Top 5 districts in Al Ain City',
      'أفضل المناطق في أبو ظبي',
    ],
  },
  {
    category: 'Geographic',
    queries: [
      'List all districts',
      'ما هي المناطق الموجودة؟',
      'Communities in Al Falah',
      'اعرض المجتمعات',
    ],
  },
];

function colorize(text: string, color: 'green' | 'blue' | 'yellow' | 'red' | 'gray'): string {
  const codes = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    gray: '\x1b[90m',
  };
  return `${codes[color]}${text}\x1b[0m`;
}

function main() {
  console.log(colorize('🧪 Testing Tool-RAG Selection\n', 'blue'));

  let totalTests = 0;
  let successfulTests = 0;

  for (const testGroup of testQueries) {
    console.log(colorize(`\n━━━ ${testGroup.category} ━━━`, 'yellow'));

    for (const query of testGroup.queries) {
      totalTests++;
      console.log(colorize(`\nQuery: "${query}"`, 'blue'));

      try {
        const result = selectToolsForMessage(query, {
          topK: 12,
          fallbackK: 20,
          alwaysInclude: ['search_geospatial_metadata'],
          debug: true,
        });

        console.log(colorize(`  Selected ${result.selectedToolNames.length} tools:`, 'green'));
        for (const name of result.selectedToolNames.slice(0, 5)) {
          console.log(colorize(`    • ${name}`, 'gray'));
        }
        if (result.selectedToolNames.length > 5) {
          console.log(colorize(`    ... and ${result.selectedToolNames.length - 5} more`, 'gray'));
        }

        if (result.debug) {
          console.log(colorize(`  Reason: ${result.debug.reason}`, 'gray'));
          if (result.debug.scored && result.debug.scored.length > 0) {
            const topScored = result.debug.scored.slice(0, 3);
            console.log(colorize(`  Top scores:`, 'gray'));
            for (const s of topScored) {
              console.log(colorize(`    ${s.name}: ${s.score}`, 'gray'));
            }
          }
        }

        successfulTests++;
      } catch (err: any) {
        console.error(colorize(`  ❌ Error: ${err.message}`, 'red'));
      }
    }
  }

  console.log(colorize(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue'));
  console.log(colorize(`\n📊 Results: ${successfulTests}/${totalTests} tests passed`, 'green'));

  if (successfulTests === totalTests) {
    console.log(colorize('✅ All tests passed!\n', 'green'));
    process.exit(0);
  } else {
    console.log(colorize(`⚠️  ${totalTests - successfulTests} test(s) failed.\n`, 'yellow'));
    process.exit(1);
  }
}

main();
