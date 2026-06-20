'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { landmarks } from '../../lib/mock-data';
import { api } from '../../lib/api';

// Dynamic import for Leaflet map to disable SSR issues
const CoordinateGrid = dynamic(
  () => import('../map/CoordinateGrid'),
  { 
    ssr: false, 
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121314] gap-3">
        <Loader2 className="animate-spin text-[#c3f400]" size={32} />
        <span className="text-[#c4c9ac] text-xs font-bold tracking-widest uppercase">Loading Campus Map...</span>
      </div>
    ) 
  }
);

// Distance calculator
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c); 
}

export default function NavigationModule() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number}>({ lat: 6.8180, lng: 3.4630 });
  const [gpsPrecision, setGpsPrecision] = useState('0.5m');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light' | 'satellite'>('dark');

  const destination = landmarks.find(l => l.id === selectedDestinationId);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLoc(coords);
        setGpsPrecision(`${position.coords.accuracy ? position.coords.accuracy.toFixed(1) : '0.5'}m`);
        
        // Post GPS location in background
        api.post('/api/locations', {
          latitude: coords.lat,
          longitude: coords.lng
        }).catch(err => console.error('GPS sync failed:', err));
      },
      (error) => {
        console.warn('GPS error fallback:', error.message);
        // Fallback to center coordinates
        setUserLoc({ lat: 6.8180, lng: 3.4630 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const filteredLandmarks = landmarks.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRecenter = () => {
    // Force a small update to userLoc to trigger MapLibre flyTo
    setUserLoc(prev => ({ lat: prev.lat + 0.0000001, lng: prev.lng }));
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#121314] relative overflow-hidden">
      
      {/* Desktop Sidebar Dashboard (Hidden on mobile, flex on md+) */}
      <div className="hidden md:flex flex-col w-[380px] h-full bg-[#121314] border-r border-white/10 z-30 relative shrink-0">
        <header className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#c3f400]">signal_disconnected</span>
            <h1 className="text-lg font-bold tracking-tight text-white">Redemption City</h1>
          </div>
          <span className="text-[10px] font-bold tracking-widest text-[#c4c9ac] px-2 py-1 bg-[#1f2021] rounded-full border border-white/5 uppercase">
            PRE-CACHED
          </span>
        </header>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto hide-scrollbar">
          {/* Search */}
          <div className="glass-card rounded-[20px] px-4 py-3 flex items-center gap-3 shadow-lg border-white/5 relative z-50">
            <span className="material-symbols-outlined text-[#c4c9ac]">search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-white w-full placeholder:text-[#c4c9ac]/40 p-0"
              placeholder="Search Landmarks..." 
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSelectedDestinationId(''); setShowSearchResults(false); }} className="text-[#c4c9ac] hover:text-white">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          
          {/* Search Results */}
          {showSearchResults && searchQuery && (
            <div className="glass-card mt-[-30px] pt-8 rounded-b-[20px] max-h-60 overflow-y-auto border border-white/10 shadow-2xl relative z-40">
              {filteredLandmarks.length > 0 ? (
                filteredLandmarks.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { setSelectedDestinationId(l.id); setSearchQuery(l.name); setShowSearchResults(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-[#c3f400]/10 text-white font-semibold text-sm border-b border-white/5 last:border-b-0 cursor-pointer"
                  >
                    {l.name}
                  </button>
                ))
              ) : (
                <div className="px-5 py-3 text-sm text-[#c4c9ac]">No landmarks found</div>
              )}
            </div>
          )}

          {/* Telemetry Dashboard */}
          <div className="flex flex-col gap-2 mt-4">

            <div className="bg-[#1a1b1c] rounded-xl p-4 border border-white/5 flex gap-4 mt-2">
              <div className="flex-1 border-r border-white/10">
                <p className="text-[9px] font-bold text-[#c4c9ac] tracking-wider uppercase">GPS PRECISION</p>
                <p className="text-xl font-black text-white mt-1 tabular-nums">{gpsPrecision}</p>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[#c4c9ac] tracking-wider uppercase">CACHE VERSION</p>
                <p className="text-sm font-bold text-white mt-1.5">v1.0.24</p>
              </div>
            </div>
          </div>

          {/* Points of Interest List */}
          <div className="mt-auto pt-6 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold tracking-widest text-[#c4c9ac] uppercase mb-1">Navigation</h4>
            
            {destination ? (
              <div className="glass-card p-4 rounded-[20px] border-l-4 border-[#c3f400] shadow-xl flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#c3f400] uppercase">DESTINATION</p>
                    <h3 className="font-bold text-base text-white mt-0.5">{destination.name}</h3>
                  </div>
                  <span className="material-symbols-outlined text-[#c3f400]">navigation</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-[#c4c9ac]">
                    {getDistanceFromLatLonInMeters(userLoc.lat, userLoc.lng, destination.lat, destination.lng)}m • Active
                  </span>
                  <button 
                    onClick={() => { setSelectedDestinationId(''); setSearchQuery(''); }}
                    className="bg-[#343536] text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card p-4 rounded-[20px] border-l-4 border-white/20 shadow-xl flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#c4c9ac] uppercase">POINT OF INTEREST</p>
                    <h3 className="font-bold text-base text-white mt-0.5">Old Auditorium</h3>
                  </div>
                  <span className="material-symbols-outlined text-[#c4c9ac]">school</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs font-semibold text-[#c4c9ac]">280m • 4 mins</span>
                  <button 
                    onClick={() => {
                      const aud = landmarks.find(l => l.id === 'auditorium');
                      if (aud) { setSelectedDestinationId(aud.id); setSearchQuery(aud.name); }
                    }}
                    className="bg-[#343536] text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                  >
                    INFO
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout Elements (Hidden on Desktop) */}
      
      {/* Top Header Mobile */}
      <header className="md:hidden bg-[#121314]/70 backdrop-blur-xl border-b border-white/10 flex justify-between items-center w-full px-6 h-16 z-30 absolute top-0">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-85 select-none">
          <span className="material-symbols-outlined text-[#c3f400]">signal_disconnected</span>
          <h1 className="text-lg font-bold tracking-tight text-white">Redemption City</h1>
        </div>
      </header>

      {/* Search Overlay Mobile */}
      <div className="md:hidden absolute top-20 left-6 right-6 z-30 max-w-md mx-auto">
        <div className="glass-card rounded-[20px] px-4 py-3 flex items-center gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-white/5 relative z-50">
          <span className="material-symbols-outlined text-[#c4c9ac]">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-medium text-white w-full placeholder:text-[#c4c9ac]/40 p-0"
            placeholder="Search Landmarks..." 
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSelectedDestinationId(''); setShowSearchResults(false); }} className="text-[#c4c9ac] hover:text-white">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
        {showSearchResults && searchQuery && (
          <div className="glass-card mt-[-16px] pt-6 rounded-b-[20px] max-h-60 overflow-y-auto border border-white/10 shadow-2xl z-40 relative">
            {filteredLandmarks.length > 0 ? (
              filteredLandmarks.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setSelectedDestinationId(l.id); setSearchQuery(l.name); setShowSearchResults(false); }}
                  className="w-full text-left px-5 py-3 hover:bg-[#c3f400]/10 text-white font-semibold text-sm border-b border-white/5 last:border-b-0 cursor-pointer"
                >
                  {l.name}
                </button>
              ))
            ) : (
              <div className="px-5 py-3 text-sm text-[#c4c9ac]">No landmarks found</div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 w-full h-full bg-transparent z-10 pt-16 md:pt-0 relative">
        <CoordinateGrid userLocation={userLoc} destination={destination as any} mapTheme={mapTheme} />
        
        {/* Floating Action Button (FAB) Over Map */}
        <div className="absolute right-6 bottom-52 md:bottom-10 md:right-10 z-20 flex flex-col gap-3 pointer-events-auto">
          {/* Map Theme Toggle */}
          <button 
            onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'satellite' : 'dark')}
            className="w-12 h-12 rounded-full bg-[#1a1b1c] border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-[#c3f400] hover:text-black hover:border-transparent active:scale-95 transition-all cursor-pointer"
            title="Toggle Map Theme"
          >
            <span className="material-symbols-outlined">
              {mapTheme === 'dark' ? 'light_mode' : mapTheme === 'light' ? 'satellite_alt' : 'dark_mode'}
            </span>
          </button>

          {/* Recenter Toggle */}
          <button 
            onClick={handleRecenter}
            className="w-12 h-12 rounded-full bg-[#1a1b1c] border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-[#c3f400] hover:text-black hover:border-transparent active:scale-95 transition-all cursor-pointer"
            title="Recenter Map"
          >
            <span className="material-symbols-outlined">my_location</span>
          </button>
        </div>

        {/* HUD Telemetry Mobile */}
        <div className="md:hidden absolute left-6 bottom-28 z-20 space-y-2 pointer-events-none">

          <div className="bg-[#0d0e0f]/90 backdrop-blur-md px-4 py-2.5 border-l-2 border-[#c3f400] rounded-r-xl select-none shadow-md">
            <p className="text-[9px] font-bold text-[#c4c9ac] tracking-wider uppercase">GPS PRECISION</p>
            <p className="text-lg font-black text-white leading-none mt-0.5 tabular-nums">{gpsPrecision}</p>
          </div>
        </div>

        {/* Bottom Cards Mobile */}
        <div className="md:hidden absolute bottom-24 left-0 w-full px-6 flex gap-3 overflow-x-auto hide-scrollbar z-20 pb-4 pointer-events-auto">
          {destination ? (
            <div className="min-w-[280px] glass-card p-4 rounded-[20px] border-l-4 border-[#c3f400] shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-[#c3f400] uppercase">DESTINATION</p>
                  <h3 className="font-bold text-base text-white mt-0.5 truncate max-w-[180px]">{destination.name}</h3>
                </div>
                <span className="material-symbols-outlined text-[#c3f400]">navigation</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-semibold text-[#c4c9ac]">
                  {getDistanceFromLatLonInMeters(userLoc.lat, userLoc.lng, destination.lat, destination.lng)}m • Active
                </span>
                <button 
                  onClick={() => { setSelectedDestinationId(''); setSearchQuery(''); }}
                  className="bg-[#343536] text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="min-w-[280px] glass-card p-4 rounded-[20px] border-l-4 border-white/20 shadow-2xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-bold tracking-wider text-[#c4c9ac] uppercase">POINT OF INTEREST</p>
                  <h3 className="font-bold text-base text-white mt-0.5">Old Auditorium</h3>
                </div>
                <span className="material-symbols-outlined text-[#c4c9ac]">school</span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-semibold text-[#c4c9ac]">280m • 4 mins</span>
                <button 
                  onClick={() => {
                    const aud = landmarks.find(l => l.id === 'auditorium');
                    if (aud) { setSelectedDestinationId(aud.id); setSearchQuery(aud.name); }
                  }}
                  className="bg-[#343536] text-white px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-85 active:scale-95 transition-all cursor-pointer"
                >
                  INFO
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
