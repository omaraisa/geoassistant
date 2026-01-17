'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  tableData: any[] | null;
  setTableData: (data: any[] | null) => void;
  chartData: any | null;
  setChartData: (data: any | null) => void;
  featureData: any | null;
  setFeatureData: (data: any | null) => void;
  isBottomPanelOpen: boolean;
  setBottomPanelOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [chartData, setChartData] = useState<any | null>(null);
  const [featureData, setFeatureData] = useState<any | null>(null);
  const [isBottomPanelOpen, setBottomPanelOpen] = useState(false);

  return (
    <AppContext.Provider value={{
      tableData,
      setTableData,
      chartData,
      setChartData,
      featureData,
      setFeatureData,
      isBottomPanelOpen,
      setBottomPanelOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}
