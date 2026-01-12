/**
 * Municipality-level queries (Abu Dhabi City, Al Ain City, Al Dhafra Region)
 */

import { arcgisClient } from '../dataLoader.js';

const TRANSACTIONS_DISTRICT_LAYER = 17;

export interface MunicipalitySalesResult {
  municipality: string;
  totalValue: number;
  totalVolume: number;
  districtCount: number;
  averagePrice: number;
  year: number;
}

/**
 * Get total sales value for an entire municipality (aggregates all districts)
 */
export async function getTotalSalesByMunicipality(
  municipality: string,
  year?: number,
  quarter?: number
): Promise<string> {
  try {
    // Build where clause
    let whereClause = `municipality='${municipality}'`;
    
    if (year) {
      whereClause += ` AND year=${year}`;
    }
    
    // Query all districts in this municipality
    const features = await arcgisClient.queryLayer<any>(TRANSACTIONS_DISTRICT_LAYER, {
      where: whereClause,
      outFields: 'district,year,typology,layout,value,volume',
      returnGeometry: false,
    });

    if (features.length === 0) {
      return `No sales data found for ${municipality}${year ? ` in ${year}` : ''}.`;
    }

    // Aggregate data
    let totalValue = 0;
    let totalVolume = 0;
    const districts = new Set<string>();

    features.forEach((feature: any) => {
      totalValue += feature.value || 0;
      totalVolume += feature.volume || 0;
      if (feature.district) {
        districts.add(feature.district);
      }
    });

    const avgPrice = totalVolume > 0 ? totalValue / totalVolume : 0;

    // Format response with field aliases
    const response = `Sales Data for ${municipality}${year ? ` in ${year}` : ''}:

Total Sales Value: AED ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Transactions Count: ${totalVolume.toLocaleString()}
Number of Districts: ${districts.size}
Average Price per Transaction: AED ${avgPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Districts included: ${Array.from(districts).join(', ')}`;

    return response;
  } catch (error: any) {
    return `Error querying municipality sales: ${error.message}`;
  }
}

/**
 * Get top districts by sales value in a municipality
 */
export async function getTopDistrictsByMunicipality(
  municipality: string,
  year: number,
  limit: number = 5
): Promise<string> {
  try {
    const whereClause = `municipality='${municipality}' AND year=${year}`;
    
    const features = await arcgisClient.queryLayer<any>(TRANSACTIONS_DISTRICT_LAYER, {
      where: whereClause,
      outFields: 'district,value,volume',
      returnGeometry: false,
    });

    if (features.length === 0) {
      return `No data found for ${municipality} in ${year}.`;
    }

    // Aggregate by district
    const districtData = new Map<string, { value: number; volume: number }>();
    
    features.forEach((feature: any) => {
      const district = feature.district;
      if (!district) return;
      
      const existing = districtData.get(district) || { value: 0, volume: 0 };
      existing.value += feature.value || 0;
      existing.volume += feature.volume || 0;
      districtData.set(district, existing);
    });

    // Sort by value
    const sorted = Array.from(districtData.entries())
      .sort((a, b) => b[1].value - a[1].value)
      .slice(0, limit);

    // Format response
    let response = `Top ${limit} Districts by Sales Value in ${municipality} (${year}):\n\n`;
    
    sorted.forEach(([district, data], index) => {
      response += `${index + 1}. ${district}
   Sales Value: AED ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
   Transactions: ${data.volume.toLocaleString()}
   Average: AED ${(data.value / data.volume).toLocaleString('en-US', { minimumFractionDigits: 2 })}

`;
    });

    return response;
  } catch (error: any) {
    return `Error querying top districts: ${error.message}`;
  }
}
