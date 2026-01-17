/**
 * ArcGIS REST API Client
 * Fetches data from https://localhost:6443/arcgis/rest/services/RealStates/MapServer
 */

// Disable SSL verification for localhost self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Layer IDs from the MapServer
export const LAYERS = {
  PLOT: 0,
  PROJECT: 1,
  COMMUNITY: 2,
  DISTRICT: 3,
  MUNICIPALITY: 4,
  RENT_REVENUE_COMMUNITY: 5,
  RENT_REVENUE_DISTRICT: 6,
  RENT_REVENUE_PROJECT: 7,
  RENTAL_INDEX_COMMUNITY: 8,
  RENTAL_INDEX_DISTRICT: 9,
  RENTAL_INDEX_PROJECT: 10,
  SALE_RATES_DISTRICT: 11,
  SALE_RATES_PROJECT: 12,
  SUPPLY_COMMUNITY: 13,
  SUPPLY_DISTRICT: 14,
  SUPPLY_PLOT: 15,
  SUPPLY_PROJECT: 16,
  TRANSACTIONS_DISTRICT: 17,
  TRANSACTIONS_PROJECT: 18,
} as const;

interface QueryOptions {
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  orderByFields?: string;
  resultRecordCount?: number;
}

class ArcGISDataLoader {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.baseUrl = 'https://localhost:6443/arcgis/rest/services/RealStates/MapServer';
    console.error(`🌐 ArcGIS REST API: ${this.baseUrl}`);
    console.error(`🔓 SSL verification disabled for localhost`);
  }

  /**
   * Query a layer from the MapServer
   */
  async queryLayer<T = any>(
    layerId: number,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const {
      where = '1=1',
      outFields = '*',
      returnGeometry = false,
      orderByFields,
      resultRecordCount,
    } = options;

    // Create cache key
    const cacheKey = `${layerId}-${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.error(`✅ Using cached data for layer ${layerId}`);
      return cached.data;
    }

    const queryUrl = `${this.baseUrl}/${layerId}/query`;
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: returnGeometry.toString(),
      outSR: '4326', // Force WGS84 Lat/Lon output
      f: 'json',
    });

    if (orderByFields) params.append('orderByFields', orderByFields);
    if (resultRecordCount) params.append('resultRecordCount', resultRecordCount.toString());

    try {
      console.error(`🔍 Querying layer ${layerId}...`);
      
      const response = await fetch(`${queryUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: any = await response.json();

      if (result.error) {
        throw new Error(`ArcGIS Error: ${result.error.message}`);
      }

      const features = result.features || [];
      const spatialReference = result.spatialReference;

      const data = features.map((f: any) => {
        if (returnGeometry) {
          // Verify if geometry has spatial reference, if not inject from result
          const geometry = f.geometry;
          if (geometry && !geometry.spatialReference && spatialReference) {
            geometry.spatialReference = spatialReference;
          }

          // Keep feature structure intact for spatial operations
          return {
            attributes: f.attributes,
            geometry: geometry
          };
        } else {
          // Flatten to attributes only for non-spatial queries
          return f.attributes;
        }
      });

      console.error(`✅ Loaded ${data.length} records from layer ${layerId}`);

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      console.error(`❌ Error querying layer ${layerId}:`, error);
      return [];
    }
  }

  /**
   * Search for text in map service layers
   */
  async find(searchText: string, layers: number[]): Promise<any[]> {
    try {
      // Build find URL
      const params = new URLSearchParams({
        f: 'json',
        searchText: searchText,
        contains: 'true',
        layers: layers.join(','),
        returnGeometry: 'false'
      });

      const url = `${this.baseUrl}/find?${params.toString()}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`ArcGIS find failed: ${response.statusText}`);
      }

      const data = await response.json() as any;
      if (data.error) {
        throw new Error(`ArcGIS error: ${data.error.message}`);
      }

      return data.results || [];
    } catch (error) {
      console.error('ArcGIS Find Error:', error);
      throw error;
    }
  }

  /**
   * Get districts
   */
  async getDistricts(where?: string) {
    return this.queryLayer(LAYERS.DISTRICT, { where, orderByFields: 'name_en' });
  }

  /**
   * Get communities
   */
  async getCommunities(where?: string) {
    return this.queryLayer(LAYERS.COMMUNITY, { where, orderByFields: 'name_en' });
  }

  /**
   * Get projects
   */
  async getProjects(where?: string) {
    return this.queryLayer(LAYERS.PROJECT, { where, orderByFields: 'project_name' });
  }

  /**
   * Get municipalities
   */
  async getMunicipalities(where?: string) {
    return this.queryLayer(LAYERS.MUNICIPALITY, { where, orderByFields: 'name_en' });
  }

  /**
   * Get transactions by district
   */
  async getTransactionsDistrict(where?: string) {
    return this.queryLayer(LAYERS.TRANSACTIONS_DISTRICT, { where });
  }

  /**
   * Get transactions by project
   */
  async getTransactionsProject(where?: string) {
    return this.queryLayer(LAYERS.TRANSACTIONS_PROJECT, { where });
  }

  /**
   * Get sale rates by district
   */
  async getSaleRatesDistrict(where?: string) {
    return this.queryLayer(LAYERS.SALE_RATES_DISTRICT, { where });
  }

  /**
   * Get rental data by district
   */
  async getRentalIndexDistrict(where?: string) {
    return this.queryLayer(LAYERS.RENTAL_INDEX_DISTRICT, { where });
  }

  /**
   * Get supply data by district
   */
  async getSupplyDistrict(where?: string) {
    return this.queryLayer(LAYERS.SUPPLY_DISTRICT, { where });
  }

  /**
   * Query with geometry for map visualization
   * Returns features with geometry for highlighting/zooming on map
   */
  async queryWithGeometry(layerId: number, where: string = '1=1') {
    return this.queryLayer(layerId, { 
      where, 
      returnGeometry: true,
    });
  }

  /**
   * Get district boundaries with geometry for map display
   */
  async getDistrictBoundaries(districtName?: string) {
    const where = districtName 
      ? `UPPER(name_en) = '${districtName.toUpperCase()}'`
      : '1=1';
    return this.queryLayer(LAYERS.DISTRICT, { 
      where, 
      returnGeometry: true,
    });
  }

  /**
   * Get project locations with geometry
   */
  async getProjectLocations(projectName?: string, district?: string) {
    let where = '1=1';
    if (projectName) {
      where = `UPPER(project_name) LIKE '%${projectName.toUpperCase()}%'`;
    } else if (district) {
      where = `UPPER(district) = '${district.toUpperCase()}'`;
    }
    return this.queryLayer(LAYERS.PROJECT, { 
      where, 
      returnGeometry: true,
    });
  }

  /**
   * Spatial query: Find features within extent
   */
  async querySpatialExtent(layerId: number, xmin: number, ymin: number, xmax: number, ymax: number) {
    const geometry = JSON.stringify({
      xmin, ymin, xmax, ymax,
      spatialReference: { wkid: 4326 }
    });
    
    const queryUrl = `${this.baseUrl}/${layerId}/query`;
    const params = new URLSearchParams({
      geometry,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });

    try {
      const response = await fetch(`${queryUrl}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: any = await response.json();
      if (result.error) {
        throw new Error(`ArcGIS Error: ${result.error.message}`);
      }

      const features = result.features || [];
      return features.map((f: any) => ({
        ...f.attributes,
        geometry: f.geometry,
      }));
    } catch (error) {
      console.error(`❌ Spatial query error:`, error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.error('🗑️  Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      cachedQueries: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const arcgisClient = new ArcGISDataLoader();
