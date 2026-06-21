'use client';

import React, { useState, useRef, useEffect } from 'react';
import { processChatQuery } from '@/lib/chat-engine';
import { api } from '@/lib/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AIChatModuleProps {
  userName?: string;
  onNavigateToMap?: (landmarkId: string) => void;
}

export default function AIChatModule({ userName = 'Guest', onNavigateToMap }: AIChatModuleProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      sender: 'assistant', 
      text: "System online. I am ENOCH, your camp guide. How can I assist you today in Redemption City?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await api.get('/api/messages');
        if (res.data && res.data.length > 0) {
          const historyMessages = res.data.map((m: any) => ({
            id: m.id,
            sender: m.role,
            text: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(historyMessages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg = textToSend.trim();
    setInput('');
    setIsTyping(true);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = Date.now().toString();
    
    setMessages(prev => [...prev, { 
      id: userMsgId, 
      sender: 'user', 
      text: userMsg,
      timestamp: timeStr
    }]);

    // Save user message to backend
    try {
      if (localStorage.getItem('token')) {
        await api.post('/api/messages', { role: 'user', content: userMsg });
      }
    } catch(e) { console.error(e) }

    try {
      // Map current messages to a simple history format (excluding user's pending/latest message)
      const chatHistory = messages.map(m => ({
        role: m.sender,
        content: m.text
      }));

      // Process using NLP engine
      const response = await processChatQuery(userMsg, userName, chatHistory);

      const aiMsgId = (Date.now() + 1).toString();
      setIsTyping(false);

      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        sender: 'assistant', 
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      // If emergency, trigger SOS alert automatically
      if (response.category === 'emergency') {
        alert("EMERGENCY DETECTED! Triggering SOS Module...");
        // In real app, trigger SOS context here.
      }

      // Automatically navigate to map to display the location after a brief delay
      if (response.landmarkId && onNavigateToMap) {
        setTimeout(() => {
          onNavigateToMap(response.landmarkId!);
        }, 1800);
      }

      // Save AI message to backend
      try {
        if (localStorage.getItem('token')) {
          await api.post('/api/messages', { role: 'assistant', content: response.text });
        }
      } catch(e) { console.error(e) }

    } catch (err) {
      console.error('AI processing failed:', err);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'assistant', 
        text: "[System Error: Offline Node Encountered a Problem]",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const handleChipClick = (label: string) => {
    setInput(label);
    handleSend(label);
  };

  return (
    <div className="flex flex-col h-full bg-[#121314] relative w-full overflow-hidden">
      
      <header className="bg-[#121314]/70 backdrop-blur-xl border-b border-white/10 flex justify-between items-center w-full px-6 h-16 z-30 absolute top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#292a2b] flex items-center justify-center overflow-hidden border border-white/10">
            <img 
              className="w-full h-full object-cover" 
              alt="ENOCH AI Entity"
              src="/enoch-logo.png"
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider">ENOCH</h1>
            <p className="text-[10px] text-[#c4c9ac] font-bold tracking-wider uppercase">CITY GUIDE</p>
          </div>
        </div>
      </header>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-6 pt-20 pb-56 space-y-6 custom-scrollbar relative z-10"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-1 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto items-end' : 'self-start items-start'
            }`}
          >
            <div className={`p-4 rounded-2xl shadow-md transition-all duration-300 ${
              msg.sender === 'user'
                ? 'bg-[#c3f400] text-black rounded-tr-none font-medium'
                : 'bg-[#1f2021] text-white rounded-tl-none border-l-4 border-[#c3f400] neon-glow'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
            <span className="text-[10px] font-bold text-[#c4c9ac]/50 px-1 uppercase tracking-wider">
              {msg.sender === 'user' ? 'You' : 'ENOCH'} • {msg.timestamp}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col gap-1 max-w-[85%] self-start items-start">
            <div className="bg-[#1f2021] p-4 rounded-2xl rounded-tl-none border-l-4 border-[#c3f400] neon-glow">
              <div className="flex items-center gap-1.5 px-1 py-1">
                <span className="w-1.5 h-1.5 bg-[#c3f400] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#c3f400] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-[#c3f400] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#c4c9ac]/50 px-1 uppercase tracking-wider">
              ENOCH is processing...
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-28 md:bottom-6 left-0 right-0 px-6 pb-2 z-20 max-w-2xl mx-auto pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button 
              onClick={() => handleChipClick('Where is the main altar?')}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer"
            >
              Where is the main altar?
            </button>
            <button 
              onClick={() => handleChipClick('I need medical help')}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer text-red-300 hover:text-red-900"
            >
              I need medical help
            </button>
            <button 
              onClick={() => handleChipClick('Where is the Youth Center?')}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer"
            >
              Where is the Youth Center?
            </button>
          </div>

          <div className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
              disabled={!isEngineReady}
              className="w-full bg-[#343536]/90 backdrop-blur-xl border border-white/10 rounded-[20px] py-4 pl-6 pr-16 text-white text-sm placeholder:text-[#c4c9ac]/40 focus:outline-none focus:border-[#c3f400]/50 transition-all disabled:opacity-50"
              placeholder={isEngineReady ? "Ask ENOCH anything..." : "Loading Engine..."}
            />
            <button 
              onClick={() => handleSend(input)}
              disabled={!input.trim() || !isEngineReady}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#c3f400] text-black rounded-xl flex items-center justify-center active:scale-90 transition-all cursor-pointer disabled:opacity-30"
            >
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
