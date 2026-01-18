'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Table, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppContext } from '@/components/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { zoomToFeature } from '@/lib/arcgis/mapService';

export default function BottomPanel() {
  const { tableData, chartData, featureData, isBottomPanelOpen, setBottomPanelOpen } = useAppContext();
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table');
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const handleRowClick = async (index: number) => {
    setSelectedRowIndex(index);

    const feature = featureData?.features?.[index];
    if (feature) {
      await zoomToFeature(feature, true);
    } else {
      console.warn('[BottomPanel] No feature found at index', index);
    }
  };

  // Auto-switch to chart tab if chart data arrives
  React.useEffect(() => {
    if (chartData && chartData.type !== 'features') {
      setActiveTab('chart');
    }
  }, [chartData]);

  // Auto-switch to table tab if feature data arrives
  React.useEffect(() => {
    if (featureData || (chartData && chartData.type === 'features')) {
      setActiveTab('table');
    }
  }, [featureData, chartData]);

  return (
    <div 
      className={clsx(
        'absolute bottom-0 left-96 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out z-20',
        isBottomPanelOpen ? 'h-80' : 'h-10'
      )}
    >
      {/* Header / Toggle Bar */}
      <div 
        className='h-10 bg-slate-50 border-b border-gray-200 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-100'
        onClick={() => setBottomPanelOpen(!isBottomPanelOpen)}
      >
        <div className='flex items-center gap-4'>
          <span className='font-semibold text-sm text-slate-700'>Data Visualization</span>
          {isBottomPanelOpen && (
            <div className='flex bg-white rounded-md border border-gray-200 p-0.5' onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setActiveTab('table')}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors',
                  activeTab === 'table' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Table size={14} /> Table
              </button>
              <button 
                onClick={() => setActiveTab('chart')}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-1.5 transition-colors',
                  activeTab === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <BarChart3 size={14} /> Charts
              </button>
            </div>
          )}
        </div>
        <button className='text-slate-500 hover:text-slate-700'>
          {isBottomPanelOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Content Area */}
      {isBottomPanelOpen && (
        <div className='h-[calc(100%-2.5rem)] overflow-auto p-4'>
          {activeTab === 'table' ? (
            tableData && tableData.length > 0 ? (
              <table className='min-w-full text-xs text-left text-slate-600'>
                <thead className='bg-slate-50 text-slate-700 font-medium'>
                  <tr>
                    {Object.keys(tableData[0]).map((key) => (
                      <th key={key} className='px-4 py-2 border-b border-gray-200'>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr 
                      key={i} 
                      onClick={() => handleRowClick(i)}
                      className={clsx(
                        'border-b border-gray-100 cursor-pointer transition-colors',
                        selectedRowIndex === i 
                          ? 'bg-yellow-100 hover:bg-yellow-200' 
                          : 'hover:bg-slate-50'
                      )}
                    >
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className='px-4 py-2'>{val?.toString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className='flex items-center justify-center h-full text-slate-400 text-sm'>
                No data selected. Ask the assistant to show data.
              </div>
            )
          ) : (
            chartData && chartData.data && chartData.data.length > 0 ? (
              <div className='w-full h-full'>
                <h3 className='text-center text-sm font-semibold text-slate-700 mb-2'>{chartData.title}</h3>
                <ResponsiveContainer width='100%' height='90%'>
                  <BarChart data={chartData.data}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='value' fill='#3b82f6' name='Value' />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className='flex items-center justify-center h-full text-slate-400 text-sm'>
                No charts available. Ask the assistant to compare data.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
