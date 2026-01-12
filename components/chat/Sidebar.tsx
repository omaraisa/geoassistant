'use client';

import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Sidebar() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (data.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
        };
        setMessages(prev => [...prev, aiMessage]);
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
      </div>

      <div className='p-4 border-t border-gray-200 bg-white'>
        <form onSubmit={handleSubmit} className='flex gap-2'>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type='text'
            placeholder='Ask a question...'
            className='flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            disabled={isLoading}
          />
          <button
            type='submit'
            className='p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
