'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardModule from './modules/Dashboard';
import NavigationModule from './modules/NavigationModule';
import AIChatModule from './modules/AIChatModule';
import ProfileModule from './modules/ProfileModule';

import InstallPrompt from './InstallPrompt';

import DeviceRecoveryModule from './modules/DeviceRecoveryModule';

const tabs = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'map', icon: 'map', label: 'Map' },
  { id: 'devices', icon: 'devices', label: 'Devices' },
  { id: 'chat', icon: 'chat_bubble', label: 'Chat' },
  { id: 'profile', icon: 'person', label: 'Profile' },
];

export default function AppShell({ onLogout }: { onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string>('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [user, setUser] = useState<{ id: number; email: string; fullName: string; profilePictureUrl?: string } | null>(null);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  const renderModule = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardModule onNavigate={setActiveTab} user={user} />;
      case 'map':
        return <NavigationModule initialDestinationId={selectedLandmarkId} initialSourceId={selectedSourceId} />;
      case 'devices':
        return <DeviceRecoveryModule />;
      case 'chat':
        return (
          <AIChatModule 
            userName={user?.fullName || 'Guest'} 
            onNavigateToMap={(landmarkId) => {
              if (landmarkId.includes('->')) {
                const [src, dest] = landmarkId.split('->');
                setSelectedSourceId(src);
                setSelectedLandmarkId(dest);
              } else {
                setSelectedSourceId('');
                setSelectedLandmarkId(landmarkId);
              }
              setActiveTab('map');
            }}
          />
        );
      case 'profile':
        return (
          <ProfileModule 
            onLogout={onLogout} 
            onProfileUpdate={(updatedUser) => {
              setUser(prev => prev ? { ...prev, profilePictureUrl: updatedUser.profilePictureUrl } : null);
            }}
          />
        );
      default:
        return <DashboardModule onNavigate={setActiveTab} user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#121314] text-[#e3e2e3] overflow-hidden md:flex-row flex-col font-sans">
      
      {/* Desktop Sidebar (Left side, matching design specs) */}
      <aside className="hidden md:flex flex-col w-72 bg-[#1b1c1d]/90 backdrop-blur-2xl border-r border-white/5 relative z-40">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#c3f400]/5 to-transparent pointer-events-none"></div>

        <div className="h-20 flex items-center px-8 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-[#c3f400] shadow-[0_0_15px_#c3f400]"></div>
            <h1 className="font-black tracking-widest text-xl text-white">ENOCH</h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl transition-all duration-200 text-sm font-bold tracking-wide select-none cursor-pointer ${
                  isActive 
                    ? 'bg-[#c3f400] text-black shadow-[0_0_20px_rgba(195,244,0,0.25)] scale-[1.01]' 
                    : 'text-[#c4c9ac] hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-white/5 bg-black/20 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#c4c9ac]/30">
              <img 
                className="w-full h-full object-cover" 
                alt="Profile Avatar"
                src={user?.profilePictureUrl || "/default-avatar.svg"}
              />
            </div>
            <div className="text-xs font-bold text-white tracking-wider">{user ? user.fullName : 'Loading...'}</div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout} 
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {/* Background Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(195,244,0,0.02)_0%,_transparent_70%)] pointer-events-none"></div>
        <div className="flex-1 overflow-y-auto relative z-10">
          {renderModule()}
        </div>
        <InstallPrompt />
      </main>

      {/* Mobile Floating Bottom Navigation (Adapted from dashboard.html & chat.html bottom nav) */}
      <nav className="md:hidden fixed bottom-6 left-0 right-0 mx-auto w-[90%] max-w-sm z-50 flex justify-around items-center py-2 px-3 bg-[#343536]/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return isActive ? (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center bg-[#c3f400] text-black rounded-full w-12 h-12 shadow-[0_0_15px_rgba(195,244,0,0.4)] transition-all duration-200 cursor-pointer"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{tab.icon}</span>
            </button>
          ) : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center text-[#c4c9ac] hover:text-[#c3f400] p-3 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              <span className="text-[10px] font-bold tracking-wider mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
