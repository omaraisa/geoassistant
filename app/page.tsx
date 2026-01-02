import Sidebar from '@/components/chat/Sidebar';
import MapContainer from '@/components/map/MapContainer';
import BottomPanel from '@/components/ui/BottomPanel';
import { AppContextProvider } from '@/components/AppContext';

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
