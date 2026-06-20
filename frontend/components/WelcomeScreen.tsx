'use client';

import React, { useEffect, useState } from 'react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // PWA detection
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone;

    if (!isStandalone) {
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShowInstallBanner(true), 2000);
        return () => clearTimeout(timer);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("To download the Enoch app to your phone:\n\n1. Open this website in Safari (iOS) or Chrome (Android).\n2. Tap the Share/Menu icon and select 'Add to Home Screen'.\n3. Open the app directly from your phone screen.");
    }
  };

  return (
    <div 
      className="flex flex-col min-h-screen text-white font-sans relative overflow-x-hidden bg-black bg-cover bg-center select-none"
      style={{ backgroundImage: `url('/background_bg.png')` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.6)_100%)] z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 z-0 pointer-events-none"></div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-24 left-4 right-4 z-[100] max-w-md mx-auto animate-[slideDown_0.5s_ease-out_forwards]">
          <div className="glass-card rounded-[24px] p-4 flex items-center justify-between gap-4 border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <span className="material-symbols-outlined text-2xl">install_mobile</span>
              </div>
              <div>
                <h4 className="text-white text-xs font-semibold tracking-wide">Install Web App</h4>
                <p className="text-[10px] text-white/60 mt-0.5">Add to your phone for seamless offline access.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleInstallClick}
                className="bg-white text-black text-[10px] font-semibold uppercase tracking-wider px-3.5 py-2.5 rounded-full hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Install
              </button>
              <button 
                onClick={() => {
                  setShowInstallBanner(false);
                  sessionStorage.setItem('pwa-prompt-dismissed', 'true');
                }}
                className="text-white/40 hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
