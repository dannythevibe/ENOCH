'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
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

        <div className="flex items-center">
          <button 
            onClick={onSignIn} 
            className="px-6 py-2.5 bg-[#1f2021]/60 backdrop-blur border border-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          >
            Login
          </button>
        </div>
      </header>

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
