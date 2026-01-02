import { DataManager } from './dataLoader';

export async function getSalesData(params: {
  district?: string;
  year?: string | number;
  typology?: string;
  layout?: string;
  metric?: 'volume' | 'value';
}) {
  const manager = await DataManager.getInstance();
  let data = manager.transactions;

  if (params.district) {
    data = data.filter(d => d.district?.toLowerCase().includes(params.district!.toLowerCase()));
  }
  if (params.year) {
    data = data.filter(d => d.year == params.year);
  }
  if (params.typology) {
    data = data.filter(d => d.typology?.toLowerCase() === params.typology!.toLowerCase());
  }
  if (params.layout) {
    data = data.filter(d => d.layout?.toLowerCase() === params.layout!.toLowerCase());
  }

  // Aggregate
  const totalVolume = data.reduce((sum, item) => sum + (item.volume || 0), 0);
  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return {
    count: data.length,
    totalVolume,
    totalValue,
    details: data.slice(0, 10) // Return top 10 for context
  };
}

export async function getRentalData(params: {
  district?: string;
  year?: string | number;
  typology?: string;
  layout?: string;
}) {
  const manager = await DataManager.getInstance();
  let data = manager.rentalIndices;

  if (params.district) {
    data = data.filter(d => d.district?.toLowerCase().includes(params.district!.toLowerCase()));
  }
  if (params.year) {
    data = data.filter(d => d.year == params.year);
  }
  if (params.typology) {
    data = data.filter(d => d.typology?.toLowerCase() === params.typology!.toLowerCase());
  }
  if (params.layout) {
    data = data.filter(d => d.layout?.toLowerCase() === params.layout!.toLowerCase());
  }

  const avgRent = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.avg_rent_value || 0), 0) / data.length 
    : 0;

  return {
    count: data.length,
    avgRent,
    details: data.slice(0, 10)
  };
}

export async function getSupplyData(params: {
  district?: string;
  year?: string | number;
}) {
  const manager = await DataManager.getInstance();
  let data = manager.supply;

  if (params.district) {
    data = data.filter(d => d.district?.toLowerCase().includes(params.district!.toLowerCase()));
  }
  if (params.year) {
    data = data.filter(d => d.supply_demand_year == params.year);
  }

  const totalSupply = data.reduce((sum, item) => sum + (item.total_supply || 0), 0);

  return {
    count: data.length,
    totalSupply,
    details: data.slice(0, 10)
  };
}
