import MapView from '@arcgis/core/views/MapView';
import Point from '@arcgis/core/geometry/Point';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';

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

export function initializeMap(mapView: MapView) {
  view = mapView;
  highlightLayer = new GraphicsLayer();
  view.map?.add(highlightLayer);
}

export function zoomToLocation(locationName: string) {
  if (!view) return;

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

function highlightLocation(point: Point) {
  if (!highlightLayer) return;
  
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
