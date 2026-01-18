
import { compareRentalValues } from './queries/rentalQueries.js';
import { arcgisClient } from './dataLoader.js';

async function testComparison() {
    console.log('Clearing cache...');
    arcgisClient.clearCache();

    console.log('--- Test 1: Compare Districts ---');
    // Use known valid districts
    const districts = ['YAS ISLAND', 'AL REEM ISLAND'];
    // Pass undefined for year to get all data
    const result1 = await compareRentalValues(districts, 'district');

    if (result1.results.length === 0) {
        console.error('ERROR: No results found for districts:', districts);
    } else {
        console.log('Comparison Text:', result1.comparison);
        console.log('Results:', JSON.stringify(result1.results, null, 2));
    }

    console.log('\n--- Test 2: Compare Projects ---');
    const projects = ["WATER'S EDGE", "ANSAM"];
    const result2 = await compareRentalValues(projects, 'project', undefined, 'Apartment / Duplex');

    if (result2.results.length === 0) {
        console.log('Note: No data found for projects, make sure names match exactly.');
        console.log('Comparison Text:', result2.comparison);
    } else {
        console.log('Comparison Text:', result2.comparison);
        console.log('Results:', JSON.stringify(result2.results, null, 2));
    }
}

testComparison().catch(console.error);
