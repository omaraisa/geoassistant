/**
 * Metadata Registry (ArcGIS Version)
 * 
 * Defines the logical structure of the map service.
 * Used to interpret search results and guide the LLM to the right data layers.
 */

import { LAYERS } from '../dataLoader.js';

export interface EntityType {
  name: string;
  masterLayerId: number;    // The layer that defines this entity (e.g., DISTRICT layer)
  nameFieldEn: string;      // Field for English name
  nameFieldAr: string;      // Field for Arabic name
  dataLayers: {             // Related data layers
    category: 'transactions' | 'rental' | 'supply' | 'sales_rates';
    layerId: number;
    description: string;
  }[];
}

export const ENTITY_REGISTRY: EntityType[] = [
  {
    name: 'District',
    masterLayerId: LAYERS.DISTRICT,
    nameFieldEn: 'name_en',
    nameFieldAr: 'name_ar',
    dataLayers: [
      { category: 'transactions', layerId: LAYERS.TRANSACTIONS_DISTRICT, description: 'Sales transactions and value' },
      { category: 'rental', layerId: LAYERS.RENTAL_INDEX_DISTRICT, description: 'Rental index and revenue' },
      { category: 'supply', layerId: LAYERS.SUPPLY_DISTRICT, description: 'Housing supply stock' },
      { category: 'sales_rates', layerId: LAYERS.SALE_RATES_DISTRICT, description: 'Sales rates per square meter' }
    ]
  },
  {
    name: 'Project',
    masterLayerId: LAYERS.PROJECT,
    nameFieldEn: 'project_name',
    nameFieldAr: 'project_name',
    dataLayers: [
      { category: 'transactions', layerId: LAYERS.TRANSACTIONS_PROJECT, description: 'Project-level transactions' },
      { category: 'rental', layerId: LAYERS.RENTAL_INDEX_PROJECT, description: 'Project rental performance' },
      { category: 'supply', layerId: LAYERS.SUPPLY_PROJECT, description: 'Project supply units' }
    ]
  },
  {
    name: 'Community',
    masterLayerId: LAYERS.COMMUNITY,
    nameFieldEn: 'name_en',
    nameFieldAr: 'name_ar',
    dataLayers: [
      { category: 'rental', layerId: LAYERS.RENTAL_INDEX_COMMUNITY, description: 'Community rental index' },
      { category: 'supply', layerId: LAYERS.SUPPLY_COMMUNITY, description: 'Community supply' }
    ]
  }
];

export function getEntityDefinition(layerId: number): EntityType | undefined {
  return ENTITY_REGISTRY.find(e => e.masterLayerId === layerId);
}
