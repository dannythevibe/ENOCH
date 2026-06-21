'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}
export default function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen text-white font-sans relative overflow-x-hidden bg-black select-none">
      {/* Optimized Background Image */}
      <Image
        src="/background_bg.png"
        alt="Enoch Background"
        fill
        priority
        className="object-cover z-0 opacity-80"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.6)_100%)] z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 z-0 pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <header className="relative z-50 w-full px-6 md:px-12 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center">
          <img src="/enoch-logo.png" alt="ENOCH" className="h-10 md:h-14 object-contain select-none" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 bg-[#1f2021]/40 backdrop-blur px-8 py-3 rounded-full border border-white/5 shadow-lg">
          <button className="text-sm font-bold text-white hover:text-[#c3f400] transition-colors cursor-pointer">Home</button>
          <button className="text-sm font-bold text-[#c4c9ac] hover:text-[#c3f400] transition-colors cursor-pointer">About</button>
          <button className="text-sm font-bold text-[#c4c9ac] hover:text-[#c3f400] transition-colors cursor-pointer">Features</button>
          <button className="text-sm font-bold text-[#c4c9ac] hover:text-[#c3f400] transition-colors cursor-pointer">Contact</button>
        </div>

        <div className="flex items-center gap-4">
          {/* Desktop Login Button */}
          <button 
            onClick={onSignIn} 
            className="hidden md:block px-6 py-2.5 bg-[#c3f400] text-black font-black text-xs uppercase tracking-wider rounded-full hover:bg-[#b0db00] active:scale-95 transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(195,244,0,0.3)]"
          >
            Login
          </button>
          
          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-12 h-12 flex items-center justify-center bg-[#1f2021]/80 backdrop-blur-xl border border-white/10 text-white rounded-full hover:bg-white/10 transition-all duration-300 cursor-pointer shadow-lg"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-[slideDown_0.3s_ease-out_forwards]">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-8 right-6 w-12 h-12 flex items-center justify-center bg-white/10 border border-white/20 text-white rounded-full cursor-pointer hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <nav className="flex flex-col items-center gap-8 w-full px-8">
            <button className="text-3xl font-black text-white hover:text-[#c3f400] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Home</button>
            <button className="text-3xl font-black text-[#c4c9ac] hover:text-[#c3f400] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</button>
            <button className="text-3xl font-black text-[#c4c9ac] hover:text-[#c3f400] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Features</button>
            <button className="text-3xl font-black text-[#c4c9ac] hover:text-[#c3f400] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Contact</button>
            
            <div className="w-full h-px bg-white/10 my-4"></div>
            
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onSignIn();
              }}
              className="w-full max-w-sm py-5 bg-[#c3f400] text-black font-black text-lg uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-[0_0_30px_rgba(195,244,0,0.3)]"
            >
              Login to System
            </button>
          </nav>
        </div>
      )}

      {/* Main Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-6xl sm:text-7xl md:text-[96px] font-black text-white leading-tight tracking-tighter drop-shadow-2xl">
            ENOCH
          </h1>
        </div>

        <p className="mt-4 text-sm md:text-lg text-[#e3e2e3] font-bold leading-relaxed max-w-[600px] mx-auto tracking-wide drop-shadow-lg">
          Your state-of-the-art offline AI assistant. Running entirely on your device with zero server dependency, ENOCH provides instant, secure guidance and navigation without ever needing an internet connection.
        </p>

        <div className="mt-12">
          <button 
            onClick={onGetStarted}
            className="px-8 py-4 bg-[#c3f400] text-black font-black text-sm tracking-widest uppercase rounded-full hover:shadow-[0_0_30px_rgba(195,244,0,0.4)] active:scale-[0.98] transition-all duration-200 cursor-pointer select-none"
          >
            Get Started
          </button>
        </div>

      </main>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
