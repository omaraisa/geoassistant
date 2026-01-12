/**
 * Rental Data Queries
 * Functions to query and analyze rental data
 */

import { arcgisClient, LAYERS } from '../dataLoader.js';

export interface RentalQueryFilters {
  district?: string;
  community?: string;
  project?: string;
  year?: number;
  typology?: string;
  layout?: string;
  rentType?: string; // 'new', 'renewal'
}

/**
 * Get average annual rent by community
 */
export async function getAverageRentByCommunity(filters: RentalQueryFilters) {
  const { district, year, layout, rentType } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  if (rentType) {
    where += ` AND UPPER(rent_type) = '${rentType.toUpperCase()}'`;
  }
  
  const data = await arcgisClient.getRentalIndexDistrict(where);
  
  const results = data.map((record: any) => ({
    district: record.district,
    year: record.year,
    typology: record.typology,
    layout: record.layout,
    rentType: record.rent_type,
    avgRent: record.avg_rent_value,
    lowerRent: record.lower_rent_value,
    upperRent: record.upper_rent_value,
    label: record.lable,
  }));
  
  return {
    results,
    count: results.length,
    filters,
  };
}

/**
 * Find units within budget
 */
export async function findUnitsByBudget(
  budget: number,
  layout: string,
  year?: number
) {
  let where = `avg_rent_value <= ${budget}`;
  
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  
  const data = await arcgisClient.getRentalIndexDistrict(where);
  
  const results = data.map((record: any) => ({
    district: record.district,
    year: record.year,
    layout: record.layout,
    avgRent: record.avg_rent_value,
    lowerRent: record.lower_rent_value,
    upperRent: record.upper_rent_value,
  }));
  
  return {
    results,
    count: results.length,
    budget,
    layout,
    year,
  };
}

/**
 * Get rental contract count
 */
export async function getRentalContractCount(filters: RentalQueryFilters) {
  const { district, year } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  
  const data = await arcgisClient.queryLayer(LAYERS.RENT_REVENUE_DISTRICT, { where });
  
  const totalContracts = data.reduce((sum: number, record: any) => {
    return sum + (record.volume || 0);
  }, 0);
  
  const totalRevenue = data.reduce((sum: number, record: any) => {
    return sum + (record.value || 0);
  }, 0);
  
  return {
    totalContracts,
    totalRevenue,
    recordCount: data.length,
    filters,
  };
}

/**
 * Compare rent between typologies
 */
export async function compareRentByTypology(
  typology1: string,
  typology2: string,
  district?: string,
  year?: number
) {
  const filters1 = { district, year, typology: typology1 };
  const filters2 = { district, year, typology: typology2 };
  
  const [data1, data2] = await Promise.all([
    getAverageRentByCommunity(filters1),
    getAverageRentByCommunity(filters2),
  ]);
  
  const avg1 = data1.results.reduce((sum, r) => sum + (r.avgRent || 0), 0) / (data1.results.length || 1);
  const avg2 = data2.results.reduce((sum, r) => sum + (r.avgRent || 0), 0) / (data2.results.length || 1);
  
  return {
    typology1: {
      name: typology1,
      averageRent: avg1,
      records: data1.results,
    },
    typology2: {
      name: typology2,
      averageRent: avg2,
      records: data2.results,
    },
    comparison: {
      difference: avg1 - avg2,
      percentDiff: avg2 > 0 ? ((avg1 - avg2) / avg2) * 100 : 0,
    },
  };
}
