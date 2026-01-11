'use client';

import React, { useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { zoomToLocation } from '@/lib/arcgis/mapService';
import { useAppContext } from '@/components/AppContext';
import { clsx } from 'clsx';

export default function Sidebar() {
  const { messages, input, handleInputChange, handleSubmit, toolInvocations, status } = useChat({
    maxSteps: 5,
  });
  
  const { setTableData, setChartData, setBottomPanelOpen } = useAppContext();

  // Handle tool invocations (client-side effects)
  useEffect(() => {
    if (!toolInvocations) return;

    toolInvocations.forEach(toolInvocation => {
      const { toolName, args, state, result } = toolInvocation;
      
      if (state === 'result') {
        if (toolName === 'update_map') {
          console.log('Zooming to', args.location);
          zoomToLocation(args.location);
        }
        
        if (['get_sales_info', 'get_rental_info', 'get_supply_info'].includes(toolName)) {
          // If data is returned, update the table
          if (result && result.details) {
            setTableData(result.details);
            setBottomPanelOpen(true);
          }
        }

        if (toolName === 'visualize_data') {
          if (result && result.success) {
            setChartData(result);
            setBottomPanelOpen(true);
          }
        }
      }
    });
  }, [toolInvocations, setTableData, setChartData, setBottomPanelOpen]);

  return (
    <div className='w-96 h-full bg-white border-r border-gray-200 flex flex-col shadow-lg z-10'>
      <div className='p-4 border-b border-gray-200 bg-slate-50'>
        <h1 className='text-xl font-bold text-slate-800'>GeoAI Assistant</h1>
        <p className='text-sm text-slate-500'>Ask about Abu Dhabi Real Estate</p>
      </div>
      
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map(m => (
          <div key={m.id} className={clsx(
            'p-3 rounded-lg max-w-[85%] text-sm',
            m.role === 'user' 
              ? 'bg-blue-600 text-white ml-auto rounded-tr-none' 
              : 'bg-slate-100 text-slate-800 mr-auto rounded-tl-none'
          )}>
            <div className='flex items-center gap-2 mb-1 opacity-70 text-xs'>
              {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
              <span>{m.role === 'user' ? 'You' : 'Assistant'}</span>
            </div>
            <div className='whitespace-pre-wrap'>{m.content}</div>
            
            {/* Show tool calls if needed, or hide them */}
            {m.toolInvocations?.map(tool => (
               <div key={tool.toolCallId} className='mt-2 text-xs bg-black/10 p-1 rounded'>
                 Using tool: {tool.toolName}...
               </div>
            ))}
          </div>
        ))}
      </div>

      <div className='p-4 border-t border-gray-200 bg-white'>
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <input 
            value={input}
            onChange={handleInputChange}
            type='text' 
            placeholder='Ask a question...' 
            className='flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            disabled={status === 'streaming' || status === 'submitted'}
          />
          <button 
            type='submit'
            className='p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            disabled={status === 'streaming' || status === 'submitted'}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
