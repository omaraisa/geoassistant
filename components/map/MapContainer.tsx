'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@arcgis/core/assets/esri/themes/light/main.css';
import { initializeMap } from '@/lib/arcgis/mapService';

export default function MapContainer() {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<any | null>(null);

  useEffect(() => {
    if (mapDiv.current && !view) {
      const initArcGIS = async () => {
        const Map = (await import('@arcgis/core/Map')).default;
        const MapView = (await import('@arcgis/core/views/MapView')).default;

        const map = new Map({
          basemap: 'gray-vector' // Professional look
        });

        const mapView = new MapView({
          container: mapDiv.current!,
          map: map,
          center: [54.3773, 24.4539], // Abu Dhabi coordinates
          zoom: 11
        });

        mapView.when(() => {
          console.log('Map View is ready');
          setView(mapView);
          initializeMap(mapView); // Register the view with our service
        });
      };

      initArcGIS();
    }
  }, [view]);

  return (
    <div className='absolute inset-0 left-96 bg-slate-200'>
      <div ref={mapDiv} className='w-full h-full' />
    </div>
  );
}
