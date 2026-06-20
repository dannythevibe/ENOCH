'use client';

import React, { useEffect, useState } from 'react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  user?: { id: number; email: string; fullName: string } | null;
}

export default function DashboardModule({ onNavigate, user }: DashboardProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [peers, setPeers] = useState(842); // Match Stitch spec

  useEffect(() => {
    // Native HTML5 Battery Status API Integration
    const getBatteryStatus = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
          battery.addEventListener('chargingchange', () => {
            setIsCharging(battery.charging);
          });
        }
      } catch (err) {
        console.error('Battery API not supported:', err);
      }
    };

    getBatteryStatus();
  }, []);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-6 py-6 pb-28 space-y-8">
      
      {/* Mobile Top AppBar Profile (adapted from dashboard.html top appbar) */}
      <header className="flex justify-between items-center w-full py-2 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c3f400] relative">
            <img 
              className="w-full h-full object-cover" 
              alt="William Current"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvWfWWSRhL6CzkOv3V6x_6OqM_oy9zstDuEEXihebiyCWmfxiFijeFwMuBNrz4KWWSeaqAqB0J7mkZa8TTd_L3dQhuC2ezgm6E0rT8VeApcZdZlhXu7Tg2BjrZlWGb6AB6he_8pAIMXZGUQAcaKMubjpPn2xZV0zKf_Di9XS5UU_aNLYjKoeqPsGO_bm7pf4RNLanDMUM7Zo5D93JWt5PDpHglQsnhFzsFjE0n7iJSUHFVpkVmXd48DPxOUsceuzZ9Xh-KgMusGOBz"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#c4c9ac] tracking-wide">Welcome back,</p>
            <h1 className="text-white font-black tracking-tight text-xl">{user ? user.fullName : 'Loading...'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-12 h-12 flex items-center justify-center rounded-full bg-[#343536] hover:opacity-85 active:scale-95 transition-all text-[#c3f400]">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
      </header>

      {/* Hero: System Status Banner */}
      <section className="relative overflow-hidden rounded-[24px] bg-[#1f2021] border border-[#444933]/20 p-8 neon-glow shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#c3f400] text-black px-3 py-1.5 rounded-full select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest uppercase">SYSTEM READY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#abd600] tracking-tight">Status: Online</h2>
            <p className="text-sm md:text-base text-[#c4c9ac] max-w-md leading-relaxed">
              City guide active and standing by.
            </p>
          </div>
        </div>
      </section>

      {/* Bento Grid: Quick Actions */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Open Map */}
        <button 
          onClick={() => onNavigate('map')}
          className="col-span-1 glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between aspect-square md:aspect-auto md:h-full hover:opacity-85 active:scale-95 transition-all text-left cursor-pointer select-none border border-transparent hover:border-[#CCFF00]/30"
        >
          <div className="w-14 h-14 bg-[#c3f400]/10 rounded-full flex items-center justify-center text-[#c3f400]">
            <span className="material-symbols-outlined text-3xl">map</span>
          </div>
          <div className="mt-6">
            <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#c4c9ac] uppercase">NAVIGATE</p>
            <h3 className="font-bold text-xl md:text-2xl text-white mt-1">Open Map</h3>
          </div>
        </button>

        {/* Chat with ENOCH */}
        <button 
          onClick={() => onNavigate('chat')}
          className="col-span-1 bg-[#c3f400] p-6 md:p-8 rounded-[24px] flex flex-col justify-between aspect-square md:aspect-auto md:h-full hover:opacity-95 active:scale-95 transition-all text-left cursor-pointer select-none"
        >
          <div className="w-14 h-14 bg-black/10 rounded-full flex items-center justify-center text-black">
            <span className="material-symbols-outlined text-3xl">chat_bubble</span>
          </div>
          <div className="mt-6">
            <p className="text-[10px] md:text-xs font-bold tracking-widest text-black/60 uppercase">GUIDE</p>
            <h3 className="font-bold text-xl md:text-2xl text-black mt-1">Chat with ENOCH</h3>
          </div>
        </button>
        
        {/* Track Devices (New Card instead of View Guidelines taking 2 columns) */}
        <button 
          onClick={() => onNavigate('devices')}
          className="col-span-1 glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between aspect-square md:aspect-auto md:h-full hover:opacity-85 active:scale-95 transition-all text-left cursor-pointer select-none border border-transparent hover:border-[#CCFF00]/30"
        >
          <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
            <span className="material-symbols-outlined text-3xl">devices</span>
          </div>
          <div className="mt-6">
            <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#c4c9ac] uppercase">ASSETS</p>
            <h3 className="font-bold text-xl md:text-2xl text-white mt-1">Track Devices</h3>
          </div>
        </button>

        {/* Guidelines */}
        <button 
          onClick={() => onNavigate('profile')}
          className="col-span-1 glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between aspect-square md:aspect-auto md:h-full hover:opacity-85 active:scale-95 transition-all text-left cursor-pointer select-none border border-transparent hover:border-white/20"
        >
          <div className="w-14 h-14 bg-[#343536] rounded-full flex items-center justify-center text-[#abd600]">
            <span className="material-symbols-outlined text-3xl">person</span>
          </div>
          <div className="mt-6">
            <p className="text-[10px] md:text-xs font-bold tracking-widest text-[#c4c9ac] uppercase">SETTINGS</p>
            <h3 className="font-bold text-xl md:text-2xl text-white mt-1">My Profile</h3>
          </div>
        </button>
      </section>

      {/* Secondary Insights / Horizontal Scroll */}
      <section className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-white text-lg">System Insights</h3>
          <button className="text-[#c3f400] text-sm font-bold uppercase tracking-wider hover:underline">See All</button>
        </div>
        
        <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-2">
          {/* Latency card */}
          <div className="min-w-[280px] md:min-w-[320px] bg-[#1b1c1d] p-6 md:p-8 rounded-[24px] border-l-4 border-[#c3f400] flex flex-col justify-between shadow-xl">
            <p className="text-[#c4c9ac] text-xs font-bold tracking-widest uppercase mb-4">CONNECTION SPEED</p>
            <div className="flex items-end justify-between">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">14ms</span>
              <div className="flex gap-1.5 h-10 items-end">
                <div className="w-2 bg-[#c3f400]/20 h-4 rounded-sm"></div>
                <div className="w-2 bg-[#c3f400]/40 h-6 rounded-sm"></div>
                <div className="w-2 bg-[#c3f400] h-10 rounded-sm"></div>
                <div className="w-2 bg-[#c3f400]/60 h-7 rounded-sm"></div>
              </div>
            </div>
          </div>



          {/* Device Power Card */}
          {batteryLevel !== null && (
            <div className="min-w-[280px] md:min-w-[320px] bg-[#1b1c1d] p-6 md:p-8 rounded-[24px] border-l-4 border-blue-500 flex flex-col justify-between shadow-xl">
              <p className="text-[#c4c9ac] text-xs font-bold tracking-widest uppercase mb-4">HARDWARE POWER</p>
              <div className="flex items-end justify-between">
                <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{batteryLevel}%</span>
                <span className="material-symbols-outlined text-blue-400 text-4xl">
                  {isCharging ? 'battery_charging_full' : 'battery_full'}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
