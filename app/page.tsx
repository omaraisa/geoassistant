'use client';

import Sidebar from '@/components/chat/Sidebar';
import BottomPanel from '@/components/ui/BottomPanel';
import { AppContextProvider } from '@/components/AppContext';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
});

export default function Home() {
  return (
    <AppContextProvider>
      <main className="flex h-screen w-screen overflow-hidden bg-gray-100 relative">
        <Sidebar />
        <MapContainer />
        <BottomPanel />
      </main>
    </AppContextProvider>
  );
}
