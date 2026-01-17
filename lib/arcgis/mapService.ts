import type MapView from '@arcgis/core/views/MapView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';

let view: MapView | null = null;
let highlightLayer: GraphicsLayer | null = null;
let resultsLayer: FeatureLayer | null = null;

export const locations: Record<string, [number, number]> = {
  'Abu Dhabi': [54.3773, 24.4539],
  'Yas Island': [54.6064, 24.4942],
  'Al Reem Island': [54.4069, 24.4959],
  'Reem Island': [54.4069, 24.4959],
  'Saadiyat Island': [54.4371, 24.5265],
  'Downtown Abu Dhabi': [54.3666, 24.4833],
  'Khalifa City': [54.5755, 24.4231],
  'Al Raha Beach': [54.5727, 24.4533],
  'Masdar City': [54.6156, 24.4266],
  'Al Maryah Island': [54.3956, 24.5019]
};

export async function initializeMap(mapView: MapView) {
  const [GraphicsLayer, LayerList] = await Promise.all([
    import('@arcgis/core/layers/GraphicsLayer'),
    import('@arcgis/core/widgets/LayerList')
  ]);
  
  view = mapView;
  highlightLayer = new GraphicsLayer.default();
  view.map?.add(highlightLayer);

  // Add LayerList widget
  const layerList = new LayerList.default({
    view: view,
    container: document.createElement('div')
  });

  // view.ui.add(layerList, {
  //   position: 'top-right'
  // });

}

export async function zoomToLocation(locationName: string) {
  if (!view) return;

  const Point = (await import('@arcgis/core/geometry/Point')).default;
  const coords = locations[locationName] || locations[Object.keys(locations).find(k => locationName.includes(k)) || ''];
  
  if (coords) {
    const point = new Point({
      longitude: coords[0],
      latitude: coords[1]
    });
    
    view.goTo({
      target: point,
      zoom: 13
    });

    highlightLocation(point);
  } else {
    console.warn(`Location ${locationName} not found`);
  }
}

async function highlightLocation(point: any) {
  if (!highlightLayer) return;
  
  const SimpleMarkerSymbol = (await import('@arcgis/core/symbols/SimpleMarkerSymbol')).default;
  const Graphic = (await import('@arcgis/core/Graphic')).default;

  highlightLayer.removeAll();
  
  const marker = new SimpleMarkerSymbol({
    color: [226, 119, 40],
    outline: {
      color: [255, 255, 255],
      width: 2
    }
  });

  const graphic = new Graphic({
    geometry: point,
    symbol: marker
  });

  highlightLayer.add(graphic);
}

export async function addFeaturesToMap(features: any[], title: string = 'Search Results') {
  if (!view) return null;

  const [FeatureLayer, Graphic] = await Promise.all([
    import('@arcgis/core/layers/FeatureLayer'),
    import('@arcgis/core/Graphic')
  ]);
  
  // Remove previous results layer
  if (resultsLayer) {
    view.map?.remove(resultsLayer);
  }

  // Pre-process features to ensure they are valid Graphics with proper geometry
  const graphics = features
    .map((f, index) => {
      // Separate attributes from geometry
      const attributes = f.attributes ? { ...f.attributes } : { ...f };
      delete attributes.geometry; // Ensure geometry is not in attributes
      
      // Clean up any invalid fields that might cause validation errors
      delete attributes.globalId;
      delete attributes.objectId;
      
      // Ensure OBJECTID is a proper number
      attributes.OBJECTID = index + 1;

      // Use autocast format for geometry - ArcGIS will handle the conversion
      let geometry = null;
      if (f.geometry) {
        // Add explicit type for autocasting
        if (f.geometry.rings) {
          geometry = {
            type: 'polygon',
            rings: f.geometry.rings,
            spatialReference: f.geometry.spatialReference || { wkid: 4326 }
          };
        } else if (f.geometry.paths) {
          geometry = {
            type: 'polyline',
            paths: f.geometry.paths,
            spatialReference: f.geometry.spatialReference || { wkid: 4326 }
          };
        } else if (f.geometry.x !== undefined && f.geometry.y !== undefined) {
          geometry = {
            type: 'point',
            x: f.geometry.x,
            y: f.geometry.y,
            spatialReference: f.geometry.spatialReference || { wkid: 4326 }
          };
        }
      }

      if (!geometry) {
        console.warn(`[Feature ${index}] No valid geometry found`, f);
        return null;
      }

      const graphic = new Graphic.default({
        geometry: geometry as any,
        attributes: attributes
      });
      return graphic;
    })
    .filter(g => g !== null); // Remove features without valid geometries

  if (graphics.length === 0) {
    console.error('[addFeaturesToMap] No valid graphics to display');
    return null;
  }


  // Dynamically create fields based on the first feature's attributes
  const firstAttributes = graphics[0].attributes;
  const fields = Object.keys(firstAttributes).map(name => {
    const value = firstAttributes[name];
    let type: 'oid' | 'string' | 'integer' | 'double' = 'string';
    
    if (name === 'OBJECTID') {
      type = 'oid';
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'double';
    }

    return {
      name,
      alias: name,
      type,
      editable: name !== 'OBJECTID',
      nullable: name !== 'OBJECTID'
    };
  });

  // Create feature layer from results
  resultsLayer = new FeatureLayer.default({
    source: graphics,
    objectIdField: 'OBJECTID',
    geometryType: 'polygon',
    spatialReference: { wkid: 4326 },
    fields: fields as any,
    title: title,
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [255, 0, 0, 0], // Fully transparent fill
        outline: {
          color: [0, 255, 255, 1], // Cyan outline
          width: 6 // thicker boundary for emphasis
        }
      }
    } as any,
    popupTemplate: {
      title: '{project}',
      content: [
        {
          type: 'fields',
          fieldInfos: fields
            .filter(f => f.name !== 'OBJECTID' && f.name !== 'geometry')
            .map(f => ({
              fieldName: f.name,
              label: f.alias
            }))
        }
      ]
    },
    visible: true,
    opacity: 1
  });

  view.map?.add(resultsLayer);
  return resultsLayer;
}

export async function zoomToFeature(feature: any, highlight: boolean = true) {
  if (!view || !feature?.geometry) {
    console.error('[zoomToFeature] Missing view or geometry', { view: !!view, feature });
    return;
  }

  // Convert plain JSON geometry to autocast format
  let geometry = null;
  if (feature.geometry.rings) {
    geometry = {
      type: 'polygon',
      rings: feature.geometry.rings,
      spatialReference: feature.geometry.spatialReference || { wkid: 4326 }
    };
  } else if (feature.geometry.paths) {
    geometry = {
      type: 'polyline',
      paths: feature.geometry.paths,
      spatialReference: feature.geometry.spatialReference || { wkid: 4326 }
    };
  } else if (feature.geometry.x !== undefined && feature.geometry.y !== undefined) {
    geometry = {
      type: 'point',
      x: feature.geometry.x,
      y: feature.geometry.y,
      spatialReference: feature.geometry.spatialReference || { wkid: 4326 }
    };
  }

  if (!geometry) {
    console.error('[zoomToFeature] Invalid geometry', feature.geometry);
    return;
  }

  
  // Calculate extent for polygons
  if (geometry.type === 'polygon' && geometry.rings) {
    const allCoords = geometry.rings.flat();
    const lons = allCoords.map((c: number[]) => c[0]);
    const lats = allCoords.map((c: number[]) => c[1]);
    const extent = {
      xmin: Math.min(...lons),
      ymin: Math.min(...lats),
      xmax: Math.max(...lons),
      ymax: Math.max(...lats)
    };
  }

  // Highlight if requested
  if (highlight && highlightLayer) {
    const Graphic = (await import('@arcgis/core/Graphic')).default;
    const SimpleFillSymbol = (await import('@arcgis/core/symbols/SimpleFillSymbol')).default;

    highlightLayer.removeAll();

    const highlightSymbol = new SimpleFillSymbol({
      color: [255, 255, 0, 0.3], // Yellow transparent
      outline: {
        color: [255, 165, 0, 1], // Orange outline
        width: 3
      }
    });

    const graphic = new Graphic({
      geometry: geometry as any,
      symbol: highlightSymbol
    });

    highlightLayer.add(graphic);

    // Zoom to exact graphic with higher zoom level and animation
    try {
      await view.goTo({
        target: graphic,
        zoom: 16 // Higher zoom for better visibility of individual features
      }, {
        duration: 1000, // 1 second animation
        easing: 'ease-in-out'
      });
      
    } catch (error) {
      console.error('[zoomToFeature] Error zoom to GRAPHIC:', error);
    }
  } else {
    // Fallback zoom if no highlight requested
    try {
      await view.goTo({ target: geometry as any, zoom: 15 });
    } catch(e) { console.error(e); }
  }
}


export function getMapView() {
  return view;
}

export function getResultsLayer() {
  return resultsLayer;
}
