/**
 * Supply Data Queries
 * Functions to query housing supply data
 */

import { arcgisClient, LAYERS } from '../dataLoader.js';

export interface SupplyQueryFilters {
  district?: string;
  community?: string;
  project?: string;
  year?: number;
  typology?: string;
  layout?: string;
}

/**
 * Get current supply by community
 */
export async function getCurrentSupplyByCommunity(filters: SupplyQueryFilters) {
  const { district, year, typology, layout } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND supply_demand_year = ${year}`;
  }
  if (typology) {
    where += ` AND typology = '${typology}'`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  
  const data = await arcgisClient.getSupplyDistrict(where);
  
  const totalSupply = data.reduce((sum: number, record: any) => {
    return sum + (record.total_supply || 0);
  }, 0);
  
  const results = data.map((record: any) => ({
    district: record.district,
    year: record.supply_demand_year,
    typology: record.typology,
    layout: record.layout,
    totalSupply: record.total_supply,
  }));
  
  return {
    totalSupply,
    results,
    count: results.length,
    filters,
  };
}

/**
 * Get total units by layout and area
 */
export async function getTotalUnitsByLayoutAndArea(
  layout: string,
  district: string,
  year: number
) {
  let where = `supply_demand_year = ${year}`;
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  
  const data = await arcgisClient.getSupplyDistrict(where);
  
  const totalUnits = data.reduce((sum: number, record: any) => {
    return sum + (record.total_supply || 0);
  }, 0);
  
  return {
    totalUnits,
    layout,
    district,
    year,
    breakdown: data.map((record: any) => ({
      typology: record.typology,
      supply: record.total_supply,
    })),
  };
}

/**
 * Get residential vs commercial supply
 */
export async function getResidentialVsCommercialSupply(
  district: string,
  year: number
) {
  const where = `supply_demand_year = ${year} AND UPPER(district) = '${district.toUpperCase()}'`;
  
  const data = await arcgisClient.getSupplyDistrict(where);
  
  let residential = 0;
  let commercial = 0;
  
  data.forEach((record: any) => {
    const supply = record.total_supply || 0;
    const typology = (record.typology || '').toLowerCase();
    
    if (typology.includes('apartment') || typology.includes('villa') || typology.includes('townhouse')) {
      residential += supply;
    } else if (typology.includes('commercial') || typology.includes('office')) {
      commercial += supply;
    }
  });
  
  return {
    district,
    year,
    residential,
    commercial,
    total: residential + commercial,
    residentialPercent: residential + commercial > 0 
      ? (residential / (residential + commercial)) * 100 
      : 0,
  };
}

/**
 * Compare future supply between districts
 */
export async function compareFutureSupply(
  district1: string,
  district2: string,
  year: number
) {
  const filters1 = { district: district1, year };
  const filters2 = { district: district2, year };
  
  const [data1, data2] = await Promise.all([
    getCurrentSupplyByCommunity(filters1),
    getCurrentSupplyByCommunity(filters2),
  ]);
  
  return {
    district1: {
      name: district1,
      totalSupply: data1.totalSupply,
      breakdown: data1.results,
    },
    district2: {
      name: district2,
      totalSupply: data2.totalSupply,
      breakdown: data2.results,
    },
    comparison: {
      difference: data1.totalSupply - data2.totalSupply,
      percentDiff: data2.totalSupply > 0 
        ? ((data1.totalSupply - data2.totalSupply) / data2.totalSupply) * 100 
        : 0,
    },
    year,
  };
}
