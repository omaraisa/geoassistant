export interface TransactionDistrict {
  municipality: string;
  district: string;
  district_id: string;
  year: string;
  typology: string;
  layout: string;
  transaction_type: string;
  value: number;
  volume: number;
}

export interface RentalIndexDistrict {
  year: string;
  district: string;
  typology: string;
  layout: string;
  rent_type: string;
  lower_rent_value: number;
  upper_rent_value: number;
  avg_rent_value: number;
}

export interface SupplyDistrict {
  district: string;
  supply_demand_year: string;
  typology: string;
  layout: string;
  total_supply: number;
}

export interface SaleRateDistrict {
  district: string;
  year: string;
  typology: string;
  sale_rate: number; // This might be a range string in CSV, need to check
}

export interface Project {
  project_name: string;
  district: string;
  developer_name: string;
  project_status: string;
  completion_date: string;
}
