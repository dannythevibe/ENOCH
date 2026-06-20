'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CreateWebWorkerMLCEngine, InitProgressReport, WebWorkerMLCEngine } from '@mlc-ai/web-llm';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `
You are the ENOCH Autonomous AI Guide running locally offline on the user's device.
Your task is to answer venue logistics, navigation, and emergency questions for Redemption City.

CRITICAL RULES:
1. You are completely offline. Do not invent or assume live data outside your cache.
2. Be concise and structured. Use bullet points for directions.
3. If the user asks about an unknown landmark, state that it is outside the current cached map matrix.
`;

const campusFaqCache = {
  emergency_exits: ["Gate 1 (North Main)", "Gate 3 (South Expressway)"],
  first_aid_hubs: "Located at Sector B behind the main Auditorium.",
  lost_property: "Report immediately to the Security Hub at Sector A8.",
  youth_center: "The Youth Center is located right after the main gate.",
  auditorium: "The Old Auditorium is outlined on the main map. The New Auditorium is further down the central boulevard.",
  general_info: "Redemption City is a fully integrated smart city with offline capabilities. Visitors can track local nodes, navigate via the map, and get offline assistance."
};

export default function AIChatModule() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      sender: 'assistant', 
      text: "System online. I am ENOCH, your fully offline campus guide. How can I assist you today in Redemption City?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // WebLLM State
  const [engine, setEngine] = useState<WebWorkerMLCEngine | null>(null);
  const [progressText, setProgressText] = useState<string>('Initializing Offline AI...');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const initLocalAI = async () => {
      try {
        const initProgressCallback = (report: InitProgressReport) => {
          if (isMounted) {
            setProgressText(report.text);
            setDownloadProgress(Math.round(report.progress * 100));
          }
        };

        const modelId = "Qwen2-0.5B-Instruct-q4f16_1-MLC";
        
        // Use WebWorker to offload AI from the main UI thread
        const newEngine = await CreateWebWorkerMLCEngine(
          new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
          modelId,
          { initProgressCallback }
        );

        if (isMounted) {
          setEngine(newEngine);
          setIsEngineReady(true);
        }
      } catch (err: any) {
        console.error("Failed to load local AI:", err);
        if (isMounted) setProgressText(`Error loading AI: ${err.message}`);
      }
    };

    initLocalAI();

    return () => {
      isMounted = false;
    };
  }, [isTestMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || (!engine && !isTestMode) || !isEngineReady) return;

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

    try {
      if (isTestMode) {
        // Mock response for UI testing
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            sender: 'assistant', 
            text: "This is a mock AI response for UI testing purposes. The WebGPU Offline Engine download was cancelled.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }, 1000);
        return;
      }

      // Build history for the engine with SYSTEM_PROMPT and Local Cache Injection
      const history: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `CURRENT CACHED LOGISTICS MATRIX:\n${JSON.stringify(campusFaqCache)}` }
      ];

      // Add previous messages as context
      messages.filter(m => m.id !== '1').forEach(m => {
        history.push({
          role: m.sender,
          content: m.text
        });
      });
      
      // Add latest user prompt
      history.push({ role: 'user', content: userMsg });

      // Create streaming response
      const chunks = await engine!.chat.completions.create({
        messages: history,
        temperature: 0.2, // Low temp for factual responses based strictly on cache
        stream: true,
      });

      const aiMsgId = (Date.now() + 1).toString();
      setIsTyping(false);

      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        sender: 'assistant', 
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      let fullReply = '';
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || '';
        fullReply += delta;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, text: fullReply } : m
        ));
      }

    } catch (err) {
      console.error('AI generation failed:', err);
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
              className="w-full h-full object-cover animate-pulse" 
              alt="ENOCH AI Entity"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAI43CZY2V3Xz9KhkL93UgfU-5OFjrBnibeOKNN3myGgficEJSLkdBeHf2mQ5Qe9KVp8yNxa0ynBGLz6Js4H2aATwsKv2-02um0c_VVU9G0VmWV_I9D4d77oaIkWxYQi1CUglcEzGDLvwW58kWJ9PH5ZuAUFeZuZVbHW7yzs3VNlQOsUh2n5AWkfgKUZWIab-18jSjClMjQlDFv8n5_0ot9g8gMEVqe2X2I2OJZk-liUykx70TTaD-bVQUMz1jruzE8KjM-PfIArgvC"
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wider">ENOCH</h1>
            <p className="text-[10px] text-[#c4c9ac] font-bold tracking-wider uppercase">CITY GUIDE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#c3f400]/10 border border-[#c3f400]/20 text-[9px] font-bold tracking-widest text-[#c3f400] uppercase animate-pulse select-none">
            {isEngineReady ? (isTestMode ? 'TEST MODE' : 'WEB-GPU AI READY') : 'DOWNLOADING AI...'}
          </span>
        </div>
      </header>

      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-6 pt-20 pb-44 space-y-6 custom-scrollbar relative z-10"
      >
        {!isEngineReady && (
          <div className="bg-[#1b1c1d] border border-white/10 rounded-2xl p-6 shadow-xl mb-6">
             <div className="flex items-center gap-3 mb-2 justify-between">
               <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#c3f400] animate-spin">download</span>
                  <h3 className="text-sm font-bold text-white">First Time Setup: Background Sync</h3>
               </div>
               <span className="text-[#c3f400] font-black">{downloadProgress}%</span>
             </div>
             <p className="text-xs text-[#c4c9ac] mb-4">Silently downloading the offline neural network to your browser cache. This only happens once.</p>
             <div className="w-full bg-black/40 rounded-full h-2 mb-2 overflow-hidden">
                <div 
                  className="bg-[#c3f400] h-full rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-white/50 font-mono mb-4">{progressText}</p>
             <button 
               onClick={() => {
                 setIsTestMode(true);
                 setIsEngineReady(true);
               }}
               className="w-full py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
             >
               Cancel
             </button>
          </div>
        )}

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
              ENOCH is consulting local cache...
            </span>
          </div>
        )}
      </div>

      <div className="absolute bottom-20 md:bottom-6 left-0 right-0 px-6 pb-2 z-20 max-w-2xl mx-auto pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-3">
          
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            <button 
              onClick={() => handleChipClick('Find nearest exit')}
              disabled={!isEngineReady}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              Find nearest exit
            </button>
            <button 
              onClick={() => handleChipClick('Lost property protocol')}
              disabled={!isEngineReady}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              Lost property
            </button>
            <button 
              onClick={() => handleChipClick('Where is the Youth Center?')}
              disabled={!isEngineReady}
              className="whitespace-nowrap px-4 py-2 bg-[#343536]/80 backdrop-blur border border-white/10 rounded-full text-xs font-bold text-white hover:bg-[#c3f400] hover:text-black transition-all duration-300 cursor-pointer disabled:opacity-50"
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
              placeholder={isEngineReady ? "Ask ENOCH anything..." : "Downloading AI..."}
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
