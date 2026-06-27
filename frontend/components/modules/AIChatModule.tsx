'use client';

import React, { useState, useRef, useEffect } from 'react';
import { processChatQuery } from '@/lib/chat-engine';
import { api } from '@/lib/api';
import { speakText, stopSpeech } from '@/lib/speech';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenText?: string;
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
  const [isListening, setIsListening] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [voiceMode, setVoiceMode] = useState<boolean>(false);
  
  const voiceModeRef = useRef(false);
  const isTypingRef = useRef(false);
  const isPlayingSpeechRef = useRef<string | null>(null);
  const bargeInArmed = useRef(false);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    isPlayingSpeechRef.current = isPlayingSpeech;
  }, [isPlayingSpeech]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const accumulatedTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const isSubmittingRef = useRef(false);
  const silenceTimeoutRef = useRef<any>(null);

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
            timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeech();
    };
  }, []);

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (isPlayingSpeech === msgId) {
      stopSpeech();
      setIsPlayingSpeech(null);
      isPlayingSpeechRef.current = null;
      bargeInArmed.current = false;
    } else {
      const msg = messages.find(m => m.id === msgId);
      const textToSpeak = msg?.spokenText || text;
      speakText(
        textToSpeak,
        () => {
          setIsPlayingSpeech(msgId);
          isPlayingSpeechRef.current = msgId;
          bargeInArmed.current = false;
          setTimeout(() => {
            if (isPlayingSpeechRef.current === msgId) {
              bargeInArmed.current = true;
            }
          }, 1200);
          if (voiceModeRef.current) {
            // Snaps listening on for manual play to allow barge-in intercept
            startListening(true);
          }
        },
        () => {
          setIsPlayingSpeech(null);
          isPlayingSpeechRef.current = null;
          bargeInArmed.current = false;
        }
      );
    }
  };

  const renderMessageText = (text: string, msgId: string, sender: 'user' | 'assistant') => {
    if (sender === 'user') {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
    }

    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, lineIdx) => {
          const elements = [];
          let lastIndex = 0;
          let match;

          const combinedRegex = /\[(.*?)\]\((map|app):([a-zA-Z0-9-_]+)\)/g;
          while ((match = combinedRegex.exec(line)) !== null) {
            const matchIndex = match.index;
            const plainText = line.substring(lastIndex, matchIndex);
            
            if (plainText) {
              elements.push(parseBoldText(plainText));
            }

            const label = match[1];
            const type = match[2];
            const target = match[3];

            elements.push(
              <button
                key={matchIndex}
                onClick={() => {
                  if (type === 'map' && onNavigateToMap) {
                    onNavigateToMap(target);
                  }
                }}
                className="inline-flex items-center gap-1 bg-[#c3f400]/15 hover:bg-[#c3f400]/30 text-[#c3f400] px-3 py-1 rounded-full text-xs font-bold border border-[#c3f400]/30 shadow-[0_0_10px_rgba(195,244,0,0.1)] hover:scale-105 active:scale-95 transition-all cursor-pointer mx-1 select-none"
              >
                <span className="material-symbols-outlined text-xs">
                  {type === 'map' ? 'map' : 'apps'}
                </span>
                {label}
              </button>
            );

            lastIndex = combinedRegex.lastIndex;
          }

          if (lastIndex < line.length) {
            elements.push(parseBoldText(line.substring(lastIndex)));
          }

          return (
            <p key={lineIdx} className="text-sm leading-relaxed min-h-[1rem]">
              {elements.length > 0 ? elements : line}
            </p>
          );
        })}
      </div>
    );
  };

  const parseBoldText = (text: string) => {
    const boldParts = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIdx = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        boldParts.push(text.substring(lastIdx, match.index));
      }
      boldParts.push(<strong key={match.index} className="font-extrabold text-[#c3f400]">{match[1]}</strong>);
      lastIdx = boldRegex.lastIndex;
    }

    if (lastIdx < text.length) {
      boldParts.push(text.substring(lastIdx));
    }

    return boldParts.length > 0 ? boldParts : text;
  };

  const handleBargeIn = () => {
    if (isPlayingSpeechRef.current && bargeInArmed.current) {
      console.log("Barge-in triggered: User speaking. Interrupting Enoch.");
      
      bargeInArmed.current = false;
      stopSpeech();
      setIsPlayingSpeech(null);
      isPlayingSpeechRef.current = null;
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      isListeningRef.current = false;
      
      setIsTyping(false);
      isTypingRef.current = false;

      const promptText = "Did you say something?";
      const aiMsgId = "barge-in-" + Date.now().toString();
      
      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        sender: 'assistant', 
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      setTimeout(() => {
        speakText(
          promptText,
          () => {
            setIsPlayingSpeech(aiMsgId);
            isPlayingSpeechRef.current = aiMsgId;
            bargeInArmed.current = false;
          },
          () => {
            setIsPlayingSpeech(null);
            isPlayingSpeechRef.current = null;
            if (voiceModeRef.current) {
              setTimeout(() => {
                if (voiceModeRef.current && !isTypingRef.current && !isPlayingSpeechRef.current) {
                  startListening(true);
                }
              }, 400);
            }
          }
        );
      }, 300);
    }
  };

  const startListening = (isVoiceMode: boolean = voiceModeRef.current) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (isListeningRef.current) {
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      accumulatedTranscriptRef.current = "";
      latestTranscriptRef.current = "";
    };

    recognition.onresult = (event: any) => {
      if (isSubmittingRef.current) {
        return;
      }

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = (accumulatedTranscriptRef.current + " " + finalTranscript + " " + interimTranscript).trim();
      setInput(currentText);
      latestTranscriptRef.current = currentText;

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // 1.5 seconds of silence means user is done speaking
      silenceTimeoutRef.current = setTimeout(() => {
        const textToSubmit = latestTranscriptRef.current.trim();
        if (textToSubmit && !isSubmittingRef.current) {
          console.log("Silence detected. Submitting voice query:", textToSubmit);
          
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {}
          }
          
          handleSend(textToSubmit, isVoiceMode);
        }
      }, 1500);

      if (finalTranscript) {
        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + finalTranscript;
      }
    };

    // Voice Barge-in support: if user speaks while Enoch is playing back speech, stop Enoch
    recognition.onspeechstart = () => {
      handleBargeIn();
    };

    recognition.onsoundstart = () => {
      handleBargeIn();
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      // Automatically restart listening loop in voiceMode when Enoch is silent and idle
      if (voiceModeRef.current) {
        setTimeout(() => {
          if (voiceModeRef.current && !isTypingRef.current && !isPlayingSpeechRef.current) {
            startListening(true);
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    } else {
      startListening(voiceMode);
    }
  };

  const toggleVoiceMode = () => {
    const newMode = !voiceMode;
    setVoiceMode(newMode);
    voiceModeRef.current = newMode;
    if (newMode) {
      setAutoSpeak(true);
      startListening(true);
    } else {
      stopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend: string, isVoiceMode: boolean = voiceModeRef.current) => {
    if (!textToSend.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    latestTranscriptRef.current = "";
    accumulatedTranscriptRef.current = "";

    const userMsg = textToSend.trim();
    setInput('');
    setIsTyping(true);
    isTypingRef.current = true;
    
    // Stop recognition to prevent picking up other inputs during process
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

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
      // Map current messages to history format
      const chatHistory = messages.map(m => ({
        role: m.sender,
        content: m.text
      }));

      // Process using NLP engine
      const response = await processChatQuery(userMsg, userName, chatHistory);

      const aiMsgId = (Date.now() + 1).toString();
      setIsTyping(false);
      isTypingRef.current = false;

      setMessages(prev => [...prev, { 
        id: aiMsgId, 
        sender: 'assistant', 
        text: response.text,
        spokenText: response.spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      // Speak response if autoSpeak is active or voice mode is enabled
      if (autoSpeak || isVoiceMode) {
        speakText(
          response.spokenText || response.text,
          () => {
            setIsPlayingSpeech(aiMsgId);
            isPlayingSpeechRef.current = aiMsgId;
            bargeInArmed.current = false;
            setTimeout(() => {
              if (isPlayingSpeechRef.current === aiMsgId) {
                bargeInArmed.current = true;
              }
            }, 1200);
            // If voiceMode is active, start listening immediately to enable barge-in
            if (voiceModeRef.current) {
              startListening(true);
            }
          },
          () => {
            setIsPlayingSpeech(null);
            isPlayingSpeechRef.current = null;
            bargeInArmed.current = false;
            // Snaps listening loop back in voiceMode after TTS finished speaking
            if (voiceModeRef.current) {
              setTimeout(() => {
                if (voiceModeRef.current && !isTypingRef.current && !isPlayingSpeechRef.current) {
                  startListening(true);
                }
              }, 600);
            }
          }
        );
      }

      // If emergency, trigger SOS alert automatically
      if (response.category === 'emergency') {
        alert("EMERGENCY DETECTED! Triggering SOS Module...");
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

      isSubmittingRef.current = false;

    } catch (err) {
      console.error('AI processing failed:', err);
      setIsTyping(false);
      isTypingRef.current = false;
      isSubmittingRef.current = false;
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

        {/* Voice Conversation Mode Controls */}
        <div className="flex items-center gap-4 select-none">
          <button
            onClick={toggleVoiceMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all cursor-pointer border ${
              voiceMode
                ? 'bg-[#c3f400] text-black border-transparent shadow-[0_0_15px_#c3f400] animate-pulse'
                : 'bg-[#1b1c1d] text-[#c4c9ac] border-white/5 hover:text-white'
            }`}
            title="Toggle Hands-Free Voice Conversation Mode"
          >
            <span className="material-symbols-outlined text-[14px] leading-none">
              {voiceMode ? 'headset_mic' : 'headset'}
            </span>
            <span>{voiceMode ? 'Voice Mode Active' : 'Voice Mode'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[#c4c9ac] tracking-wider uppercase hidden sm:inline">Auto Speak</span>
            <button 
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                autoSpeak || voiceMode ? 'bg-[#c3f400]' : 'bg-[#343536] border border-white/10'
              }`}
              title="Toggle Autoplay Speech"
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                autoSpeak || voiceMode ? 'translate-x-6 bg-black' : 'translate-x-1 bg-[#c4c9ac]'
              }`} />
            </button>
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
              {renderMessageText(msg.text, msg.id, msg.sender)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#c4c9ac]/50 px-1 uppercase tracking-wider">
                {msg.sender === 'user' ? `You • ${msg.timestamp}` : 'ENOCH'}
              </span>
              {msg.sender === 'assistant' && (
                <button 
                  onClick={() => handleToggleSpeech(msg.id, msg.text)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                    isPlayingSpeech === msg.id
                      ? 'bg-[#c3f400] text-black border-transparent shadow-[0_0_10px_#c3f400]'
                      : 'bg-[#1b1c1d] text-[#c4c9ac] border-white/5 hover:text-white hover:border-white/10'
                  }`}
                  title="Listen to Enoch"
                >
                  <span className="material-symbols-outlined text-xs leading-none">
                    {isPlayingSpeech === msg.id ? 'volume_up' : 'volume_mute'}
                  </span>
                </button>
              )}
            </div>
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

          {isPlayingSpeech && (
            <div className="bg-[#1f2021]/90 backdrop-blur-xl border border-[#c3f400]/20 rounded-2xl p-3 px-5 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(195,244,0,0.1)] select-none">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c3f400] text-sm animate-pulse">graphic_eq</span>
                <span className="text-[10px] text-white font-bold tracking-widest uppercase">Enoch is speaking...</span>
              </div>
              <div className="flex gap-1 items-end h-4">
                <span className="w-0.5 h-3 bg-[#c3f400] rounded-sm animate-pulse"></span>
                <span className="w-0.5 h-4 bg-[#c3f400] rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-0.5 h-2 bg-[#c3f400] rounded-sm animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-0.5 h-4 bg-[#c3f400] rounded-sm animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-0.5 h-3 bg-[#c3f400] rounded-sm animate-pulse" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}

          <div className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
              disabled={!isEngineReady}
              className="w-full bg-[#343536]/90 backdrop-blur-xl border border-white/10 rounded-[20px] py-4 pl-6 pr-28 text-white text-sm placeholder:text-[#c4c9ac]/40 focus:outline-none focus:border-[#c3f400]/50 transition-all disabled:opacity-50"
              placeholder={isListening ? "Listening... Speak now..." : isEngineReady ? "Ask ENOCH anything..." : "Loading Engine..."}
            />
            <button 
              onClick={toggleListening}
              className={`absolute right-14 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-all cursor-pointer rounded-xl ${
                isListening 
                  ? 'bg-[#c3f400]/20 text-[#c3f400] border border-[#c3f400]/30 animate-pulse' 
                  : 'text-[#c4c9ac] hover:text-white'
              }`}
              title="Speak to type"
            >
              <span className="material-symbols-outlined">{isListening ? 'graphic_eq' : 'mic'}</span>
            </button>
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
