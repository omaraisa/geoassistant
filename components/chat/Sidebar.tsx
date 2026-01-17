'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppContext } from '@/components/AppContext';
import { addFeaturesToMap, zoomToFeature } from '@/lib/arcgis/mapService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Sidebar() {
  const { setChartData, setTableData, setFeatureData, setBottomPanelOpen } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Send only last 7 messages for context (saves tokens)
      const recentHistory = messages.slice(-7);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          history: recentHistory
        }),
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Handle visualization data
        if (data.chartData) {
          console.log('[Sidebar] Visualization data received:', data.chartData);
          
          if (data.chartData.type === 'features') {
            // Feature-based results (map + table)
            setTableData(data.chartData.tableData);
            setFeatureData(data.chartData);
            setBottomPanelOpen(true);

            // Add features to map and zoom to first result
            if (data.chartData.features && data.chartData.features.length > 0) {
              const featureLayer = await addFeaturesToMap(data.chartData.features, data.chartData.title);
              await zoomToFeature(data.chartData.features[0], true);
            }
          }”},{ else {
            // Chart-based results
            setChartData(data.chartData);
            setBottomPanelOpen(true);
          }
        }
      } else if (data.error) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error}`,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className='whitespace-pre-wrap'>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className='bg-slate-100 text-slate-800 mr-auto rounded-tl-none p-3 rounded-lg max-w-[85%] text-sm'>
            <div className='flex items-center gap-2 mb-1 opacity-70 text-xs'>
              <Bot size={12} />
              <span>Assistant</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex gap-1'>
                <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce'></div>
                <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                <div className='w-2 h-2 bg-slate-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className='text-xs text-slate-500'>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className='p-4 border-t border-gray-200 bg-white'>
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Ask a question... (Shift+Enter for new line)'
            className='flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none min-h-[40px] max-h-[120px] overflow-y-auto'
            disabled={isLoading}
            rows={1}
          />
          <button
            type='submit'
            className='p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 self-end'
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
