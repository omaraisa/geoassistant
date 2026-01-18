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

  // Use RENTAL_INDEX_PROJECT (Layer 10) for more granular results (buildings/complexes)
  // This matches user expectation of "Plot" level results closer than District
  const features = await arcgisClient.queryLayer(LAYERS.RENTAL_INDEX_PROJECT, {
    where,
    outFields: '*',
    returnGeometry: true
  });

  const results = features.map((feature: any) => ({
    district: feature.attributes.district,
    project: feature.attributes.project_name || feature.attributes.project || feature.attributes.name_en, // Try common naming conventions
    year: feature.attributes.year,
    layout: feature.attributes.layout,
    avgRent: feature.attributes.avg_rent_value,

    lowerRent: feature.attributes.lower_rent_value,
    upperRent: feature.attributes.upper_rent_value,
    typology: feature.attributes.typology,
  }));

  return {
    results,
    features, // Raw features with attributes and geometry separated
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

/**
 * Compare rental values between multiple entities
 */
export async function compareRentalValues(
  entities: string[],
  entityType: 'district' | 'project' | 'community',
  year?: number,
  typology?: string,
  layout?: string
) {
  let where = '1=1';

  if (entities.length > 0) {
    const entityList = entities.map(e => `'${e.toUpperCase()}'`).join(',');
    if (entityType === 'district') {
      where += ` AND district IN (${entityList})`;
    } else if (entityType === 'project') {
      // Try to match both project_name and name_en fields to be safe
      where += ` AND (project_name IN (${entityList}) OR name_en IN (${entityList}))`;
    } else {
      where += ` AND community IN (${entityList})`;
    }
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

  // Select appropriate layer based on entity type for best granularity
  let layerId: number = LAYERS.RENTAL_INDEX_DISTRICT;
  if (entityType === 'project') layerId = LAYERS.RENTAL_INDEX_PROJECT;
  if (entityType === 'community') layerId = LAYERS.RENTAL_INDEX_COMMUNITY;

  console.log(`DEBUG: compareRentalValues layer=${layerId} where=${where}`);
  const data = await arcgisClient.queryLayer(layerId, { where });
  console.log(`DEBUG: data length=${data.length}`);

  // Group by entity
  const groupMap = new Map<string, any>();

  data.forEach((record: any) => {
    // Determine the key based on entity type
    let key = record.district;
    if (entityType === 'project') key = record.project_name || record.name_en;
    if (entityType === 'community') key = record.community || record.name_en;

    if (!key) return; // Skip if key is missing (shouldn't happen)

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        name: key,
        totalRentSum: 0,
        recordCount: 0,
        minRent: Infinity,
        maxRent: -Infinity,
        records: []
      });
    }

    const group = groupMap.get(key);
    // Use avg_rent_value for calculation
    const rentVal = record.avg_rent_value || 0;

    if (rentVal > 0) {
      group.totalRentSum += rentVal;
      group.recordCount++;
      group.minRent = Math.min(group.minRent, rentVal);
      group.maxRent = Math.max(group.maxRent, rentVal);
    }

    group.records.push({
      ...record,
      val: rentVal
    });
  });

  // Calculate averages and stats
  const results = Array.from(groupMap.values()).map(group => {
    const avgRent = group.recordCount > 0 ? group.totalRentSum / group.recordCount : 0;
    return {
      entity: group.name,
      averageRent: Math.round(avgRent),
      minRent: group.minRent === Infinity ? 0 : group.minRent,
      maxRent: group.maxRent === -Infinity ? 0 : group.maxRent,
      recordCount: group.recordCount,
    };
  }).sort((a, b) => b.averageRent - a.averageRent); // Sort high to low

  // Generate comparison text
  let comparisonText = '';
  if (results.length >= 2) {
    const highest = results[0];
    const lowest = results[results.length - 1];
    const diff = highest.averageRent - lowest.averageRent;
    const percent = lowest.averageRent > 0 ? (diff / lowest.averageRent) * 100 : 0;

    comparisonText = `${highest.entity} has the highest average rent (${highest.averageRent.toLocaleString()} AED), ` +
      `which is ${Math.round(percent)}% higher than ${lowest.entity} (${lowest.averageRent.toLocaleString()} AED).`;
  } else if (results.length === 1) {
    comparisonText = `Showing rental data for ${results[0].entity}.`;
  } else {
    comparisonText = 'No rental data found for the specified entities.';
  }

  return {
    results,
    comparison: comparisonText,
    chartData: {
      labels: results.map(r => r.entity),
      datasets: [
        {
          label: 'Average Rent (AED)',
          data: results.map(r => r.averageRent)
        }
      ]
    },
    filters: { entities, entityType, year, typology, layout }
  };
}

