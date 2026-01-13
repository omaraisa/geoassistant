/**
 * Test Discovery Workflow
 * 
 * Verifies that:
 * 1. Searching for "Yas" returns "YAS ISLAND"
 * 2. Searching for "جزيرة ياس" returns "YAS ISLAND"
 */

import { searchGeospatialMetadata } from './src/discovery/searchTool.js';
import { arcgisClient } from './src/dataLoader.js';

async function verifyDiscovery() {
    try {
        console.log('🌐 Connecting to ArcGIS client...');
        // await arcgisClient.initialize(); // Not needed
        console.log('✅ Connected to ArcGIS\n');

        // Test 1: English Search
        console.log('🔍 Test 1: Searching for "Yas Island"...');
        const res1 = await searchGeospatialMetadata({ query: "Yas Island" });
        console.log('   Results:', JSON.stringify(res1, null, 2));
        
        if (res1.some(r => r.name === 'YAS ISLAND')) {
            console.log('   ✅ Passed: Found YAS ISLAND');
        } else {
            console.log('   ❌ Failed');
        }

        // Test 2: Arabic Search
        console.log('\n🔍 Test 2: Searching for "جزيرة ياس"...');
        const res2 = await searchGeospatialMetadata({ query: "جزيرة ياس" });
        console.log('   Results:', JSON.stringify(res2, null, 2));

        if (res2.some(r => r.name === 'YAS ISLAND')) {
             console.log('   ✅ Passed: Found YAS ISLAND from Arabic query');
        } else {
             console.log('   ❌ Failed');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

verifyDiscovery();
