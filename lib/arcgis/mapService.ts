import type MapView from '@arcgis/core/views/MapView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

let view: MapView | null = null;
let highlightLayer: GraphicsLayer | null = null;

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
