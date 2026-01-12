/**
 * Sales Data Queries
 * Functions to query and analyze sales transactions and rates
 */

import { arcgisClient, LAYERS } from '../dataLoader.js';

export interface SalesQueryFilters {
  district?: string;
  project?: string;
  year?: number;
  quarter?: number;
  typology?: string; // 'Apartment / Duplex', 'Villa / Townhouse', etc.
  layout?: string;   // '1 bed', '2 beds', '3 beds', etc.
}

/**
 * Get total sales value for a district
 */
export async function getTotalSalesValue(filters: SalesQueryFilters) {
  const { district, year, quarter, typology, layout } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  if (typology) {
    where += ` AND typology = '${typology}'`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  
  const data = await arcgisClient.getTransactionsDistrict(where);
  
  // Sum up the values
  const totalValue = data.reduce((sum: number, record: any) => {
    return sum + (record.value || 0);
  }, 0);
  
  const totalVolume = data.reduce((sum: number, record: any) => {
    return sum + (record.volume || 0);
  }, 0);
  
  return {
    totalValue,
    totalVolume,
    recordCount: data.length,
    district,
    year,
    quarter,
    typology,
    layout,
  };
}

/**
 * Get total sales volume (number of transactions)
 */
export async function getSalesVolume(filters: SalesQueryFilters) {
  const { district, project, year, typology, layout } = filters;
  
  // Query district or project level
  const useProjectLevel = !!project;
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (project) {
    where += ` AND UPPER(project_name) = '${project.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  if (typology) {
    where += ` AND typology = '${typology}'`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  
  const data = useProjectLevel
    ? await arcgisClient.getTransactionsProject(where)
    : await arcgisClient.getTransactionsDistrict(where);
  
  const totalVolume = data.reduce((sum: number, record: any) => {
    return sum + (record.volume || 0);
  }, 0);
  
  const totalValue = data.reduce((sum: number, record: any) => {
    return sum + (record.value || 0);
  }, 0);
  
  return {
    totalVolume,
    totalValue,
    averagePrice: totalVolume > 0 ? totalValue / totalVolume : 0,
    recordCount: data.length,
    filters,
  };
}

/**
 * Get average sale price per sqm by community
 */
export async function getAveragePricePerSqm(filters: SalesQueryFilters) {
  const { district, year, typology, layout } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  if (typology) {
    where += ` AND typology = '${typology}'`;
  }
  if (layout) {
    where += ` AND layout = '${layout}'`;
  }
  
  const data = await arcgisClient.getSaleRatesDistrict(where);
  
  // Group by district and calculate averages
  const results = data.map((record: any) => ({
    district: record.district,
    year: record.year,
    typology: record.typology,
    layout: record.layout,
    saleRate: record.sale_rate,
    label: record.lable,
  }));
  
  return {
    results,
    count: results.length,
    filters,
  };
}

/**
 * Get top projects by sales volume
 */
export async function getTopProjectsBySales(year: number, limit: number = 10) {
  let where = '1=1';
  
  if (year) {
    where += ` AND year = ${year}`;
  }
  
  const data = await arcgisClient.getTransactionsProject(where);
  
  // Group by project and sum volumes
  const projectMap = new Map<string, any>();
  
  data.forEach((record: any) => {
    const key = record.project_name;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        projectName: record.project_name,
        district: record.district,
        totalVolume: 0,
        totalValue: 0,
      });
    }
    const project = projectMap.get(key);
    project.totalVolume += record.volume || 0;
    project.totalValue += record.value || 0;
  });
  
  // Sort by volume and get top N
  const sorted = Array.from(projectMap.values())
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, limit);
  
  return {
    topProjects: sorted,
    year,
    limit,
  };
}

/**
 * Compare sales between two districts
 */
export async function compareSalesBetweenDistricts(
  district1: string,
  district2: string,
  year?: number
) {
  const filters1 = { district: district1, year };
  const filters2 = { district: district2, year };
  
  const [data1, data2] = await Promise.all([
    getTotalSalesValue(filters1),
    getTotalSalesValue(filters2),
  ]);
  
  return {
    district1: {
      name: district1,
      ...data1,
    },
    district2: {
      name: district2,
      ...data2,
    },
    comparison: {
      valueDifference: data1.totalValue - data2.totalValue,
      volumeDifference: data1.totalVolume - data2.totalVolume,
      valuePercentDiff: data2.totalValue > 0 
        ? ((data1.totalValue - data2.totalValue) / data2.totalValue) * 100 
        : 0,
    },
  };
}

/**
 * Get transaction count for a location and period
 */
export async function getTransactionCount(filters: SalesQueryFilters) {
  const { district, year } = filters;
  
  let where = '1=1';
  
  if (district) {
    where += ` AND UPPER(district) = '${district.toUpperCase()}'`;
  }
  if (year) {
    where += ` AND year = ${year}`;
  }
  
  const data = await arcgisClient.getTransactionsDistrict(where);
  
  const totalTransactions = data.reduce((sum: number, record: any) => {
    return sum + (record.volume || 0);
  }, 0);
  
  return {
    totalTransactions,
    recordCount: data.length,
    district,
    year,
  };
}
