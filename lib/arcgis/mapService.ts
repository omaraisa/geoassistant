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
  const GraphicsLayer = (await import('@arcgis/core/layers/GraphicsLayer')).default;
  view = mapView;
  highlightLayer = new GraphicsLayer();
  view.map?.add(highlightLayer);
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

  const FeatureLayer = (await import('@arcgis/core/layers/FeatureLayer')).default;
  
  // Remove previous results layer
  if (resultsLayer) {
    view.map?.remove(resultsLayer);
  }

  // Create feature layer from results with outline symbology
  resultsLayer = new FeatureLayer({
    source: features,
    objectIdField: 'OBJECTID',
    fields: Object.keys(features[0] || {}).map(name => ({
      name,
      type: name === 'OBJECTID' ? 'oid' : 'string'
    })),
    renderer: {
      type: 'simple',
      symbol: {
        type: 'simple-fill',
        color: [0, 0, 0, 0], // Transparent fill
        outline: {
          color: [0, 122, 194, 1], // Blue outline
          width: 2
        }
      }
    } as any,
    title,
    popupEnabled: true
  });

  view.map?.add(resultsLayer);
  return resultsLayer;
}

export async function zoomToFeature(feature: any, highlight: boolean = true) {
  if (!view || !feature?.geometry) return;

  // Zoom to feature extent
  await view.goTo({
    target: feature.geometry,
    zoom: 13
  });

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
      geometry: feature.geometry,
      symbol: highlightSymbol
    });

    highlightLayer.add(graphic);
  }
}

export function getMapView() {
  return view;
}

export function getResultsLayer() {
  return resultsLayer;
}
