/**
 * Discovery Tool
 * 
 * Exposes the "search_geospatial_metadata" tool to the LLM.
 * Chains the user's query -> ArcGIS Find -> Entity Registry -> Metadata match
 */

import { arcgisClient, LAYERS } from '../dataLoader.js';
import { ENTITY_REGISTRY } from './metadataRegistry.js';

interface SearchResult {
    entityType: string;         // 'District', 'Project', etc.
    name: string;               // 'Yas Island'
    matchedValue: string;       // 'جزيرة ياس' if user searched Arabic
    layerId: number;            // 3 (District Layer)
    availableData: string[];    // ['Sales Transactions', 'Rental Index', ...]
    filterFieldEn: string;      // 'DISTRICT_EN'
}

export async function searchGeospatialMetadata(args: { query: string }): Promise<SearchResult[]> {
    const { query } = args;
    
    // Helper to find case-insensitive key
    const findKey = (obj: any, key: string) => Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());

    // 1. Determine which layers to search

    // We search the "Master" layers: District (3), Project (1), Community (2)
    const searchLayers = ENTITY_REGISTRY.map(e => e.masterLayerId);

    // 2. Call ArcGIS Find
    // This handles fuzzy matching, case insensitivity, and Arabic natively if data is there
    const results = await arcgisClient.find(query, searchLayers);

    // 3. Process results & Handle missing attributes
    const mappedResults: SearchResult[] = [];
    const pendingFetches: Map<number, Set<number>> = new Map(); // layerId -> Set<OBJECTID>

    // First pass: Direct mapping or identifying missing data
    for (const res of results) {
        const entityDef = ENTITY_REGISTRY.find(e => e.masterLayerId === res.layerId);
        if (!entityDef) continue;
        
        const enKey = findKey(res.attributes, entityDef.nameFieldEn);
        let nameEn = enKey ? res.attributes[enKey] : undefined;
        
        // If we have the English name, great.
        if (nameEn) {
            mappedResults.push(createResult(entityDef, nameEn, res.value, res.layerId));
        } else {
            // Case: We found it (e.g. by Arabic name) but don't have the English name attribute.
            // We need to fetch the full record.
            const idKey = findKey(res.attributes, 'OBJECTID') || findKey(res.attributes, 'FID');
            const objectId = idKey ? res.attributes[idKey] : undefined;
            
            if (objectId) {
                if (!pendingFetches.has(res.layerId)) {
                    pendingFetches.set(res.layerId, new Set());
                }
                pendingFetches.get(res.layerId)!.add(objectId);
            }
        }
    }

    // 4. Fetch missing details if any
    for (const [layerId, objectIds] of pendingFetches.entries()) {
        if (objectIds.size === 0) continue;
        
        const entityDef = ENTITY_REGISTRY.find(e => e.masterLayerId === layerId)!;
        const ids = Array.from(objectIds).join(',');
        
        // Query the layer specifically for these objects to get the English field
        try {
            const enrichedRecords = await arcgisClient.queryLayer(layerId, {
                where: `OBJECTID IN (${ids})`,
                outFields: '*'
            });

            for (const record of enrichedRecords) {
                const enKey = findKey(record, entityDef.nameFieldEn);
                const arKey = findKey(record, entityDef.nameFieldAr);
                
                const nameEn = enKey ? record[enKey] : undefined;
                const nameAr = arKey ? record[arKey] : undefined;
                
                const identifier = nameEn || nameAr; // fallback
                if (identifier) {
                    mappedResults.push(createResult(entityDef, identifier, identifier, layerId));
                }
            }
        } catch (error) {
            console.error(`Failed to enrich search results for layer ${layerId}`, error);
        }
    }

    // 5. Deduplicate results
    // We might have duplicates if "Yas Island" appears multiple times in the source or found via multiple paths
    const uniqueResults = new Map<string, SearchResult>();
    
    for (const res of mappedResults) {
        const key = `${res.layerId}:${res.name}`;
        if (!uniqueResults.has(key)) {
            uniqueResults.set(key, res);
        }
    }

    return Array.from(uniqueResults.values());
}

function createResult(entityDef: any, name: string, matchedValue: string, layerId: number): SearchResult {
    return {
        entityType: entityDef.name,
        name: name,
        matchedValue: matchedValue,
        layerId: layerId,
        filterFieldEn: entityDef.nameFieldEn,
        availableData: entityDef.dataLayers.map((dl: any) => dl.description)
    };
}

