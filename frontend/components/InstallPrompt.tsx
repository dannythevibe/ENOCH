'use client';

import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to show the install promotion
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed, hide the prompt
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-4 md:hidden animate-slide-up">
      <div className="glass-card rounded-[20px] p-4 flex items-center justify-between shadow-2xl border-t-2 border-[#c3f400]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#121314] rounded-xl flex items-center justify-center border border-white/10 shrink-0">
            <span className="material-symbols-outlined text-[#c3f400]">app_shortcut</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Download ENOCH</h4>
            <p className="text-[10px] text-[#c4c9ac] font-medium mt-0.5">Install the Web App for offline access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center text-[#c4c9ac] hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <button 
            onClick={handleInstallClick}
            className="bg-[#c3f400] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
