'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Device {
  id: string;
  name: string;
  battery?: number;
  status?: string;
  lastSeen?: string;
  location?: string;
}

export default function DeviceRecoveryModule() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [playingSound, setPlayingSound] = useState(false);
  const [securing, setSecuring] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/devices');
      if (res.data) {
        const apiDevices = res.data.map((d: any) => ({
          id: d.id || d.Id,
          name: d.name || d.Name,
          battery: d.batteryLevel || d.BatteryLevel || Math.floor(Math.random() * 40) + 60,
          status: d.status || d.Status || 'Connected',
          lastSeen: 'Just now',
          location: d.location || d.Location || 'Redemption Campus, Library'
        }));
        setDevices(apiDevices);
        setSelectedDevice(prev => {
          if (prev) {
            const found = apiDevices.find((x: any) => x.id === prev.id);
            if (found) return found;
          }
          return apiDevices.length > 0 ? apiDevices[0] : null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handlePlaySound = () => {
    if (!selectedDevice) return;
    setPlayingSound(true);
    setTimeout(() => setPlayingSound(false), 3000);
  };

  const handleSecureDevice = async () => {
    if (!selectedDevice) return;
    setSecuring(true);
    try {
      await api.put(`/api/devices/${selectedDevice.id}/status`, 'Secured');
      setSelectedDevice(prev => prev ? { ...prev, status: 'Secured' } : null);
      setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Secured' } : d));
    } catch (err) {
      console.error('Failed to secure device:', err);
    } finally {
      setTimeout(() => setSecuring(false), 2000);
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    setAddingDevice(true);
    try {
      const mockMac = Array.from({ length: 6 }, () => 
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
      ).join(':');

      await api.post('/api/devices', {
        name: newDeviceName,
        macAddress: mockMac
      });
      setNewDeviceName('');
      await fetchDevices();
    } catch (err) {
      console.error('Failed to add device:', err);
    } finally {
      setAddingDevice(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-6 pb-28 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center w-full py-2 z-20">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white dark:text-white tracking-tight">Devices & Assets</h2>
          <p className="text-xs md:text-sm text-[#c4c9ac] font-medium mt-1">Real-time telemetry and tracking for your connected mesh nodes.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Radar and Selection */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Pulse Map Radar Layout */}
          <div className="relative w-full h-64 md:h-80 rounded-[24px] bg-[#1f2021] border border-white/5 overflow-hidden flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(195,244,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(195,244,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#CCFF00] flex items-center justify-center shadow-[0_0_25px_#CCFF00] relative">
                <div className="absolute inset-0 w-full h-full rounded-full bg-[#CCFF00] animate-ping opacity-75"></div>
                <div className="w-4 h-4 rounded-full bg-[#121314]"></div>
              </div>
              <div className="mt-4 bg-[#121314]/80 backdrop-blur px-5 py-2 rounded-full border border-white/10 select-none shadow-md">
                <span className="text-xs font-bold text-[#CCFF00] tracking-widest uppercase">
                  {selectedDevice ? selectedDevice.name : 'NO FOCUS'}
                </span>
              </div>
            </div>
          </div>

          {/* Devices Selector List */}
          {devices.length > 1 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-widest text-[#c4c9ac] uppercase px-1">Registered Nodes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                {devices.map((device) => {
                  if (device.id === selectedDevice?.id) return null;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className="glass-card px-4 py-4 rounded-2xl flex flex-col items-start hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-left select-none border border-transparent hover:border-[#CCFF00]/30"
                    >
                      <h4 className="text-white font-bold text-sm truncate w-full">{device.name}</h4>
                      <div className="flex justify-between items-center w-full mt-2">
                        <p className="text-[#c4c9ac] text-[10px]">{device.lastSeen}</p>
                        <span className="text-[#CCFF00] font-bold text-xs">{device.battery}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Details and Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {selectedDevice ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Active Device Info Bento Box */}
              <div className="md:col-span-2 glass-card p-6 md:p-8 rounded-[24px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-[#1b1c1d] flex items-center justify-center text-[#c3f400] shadow-inner">
                    <span className="material-symbols-outlined text-3xl">smartphone</span>
                  </div>
                  <div>
                    <h3 className="text-white font-black text-2xl tracking-tight">{selectedDevice.name}</h3>
                    <p className="text-[#c4c9ac] text-sm font-semibold mt-1">Last seen: {selectedDevice.lastSeen}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto bg-[#1b1c1d]/50 p-4 rounded-xl border border-white/5">
                  <span className="text-[#CCFF00] font-black text-3xl tracking-tighter">{selectedDevice.battery}%</span>
                  <p className="text-[#c4c9ac] text-[10px] font-bold tracking-wider uppercase leading-none mt-1">Battery Power</p>
                </div>
              </div>

              {/* Location Details Card */}
              <div className="md:col-span-2 glass-card overflow-hidden rounded-[24px]">
                <div className="p-6 md:p-8 border-b border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-bold text-[#c4c9ac] tracking-widest uppercase">Last Known Coordinates</span>
                      <h4 className="text-white font-bold text-xl mt-1">{selectedDevice.location}</h4>
                    </div>
                    <div className="bg-[#CCFF00]/15 px-4 py-1.5 rounded-full border border-[#CCFF00]/25">
                      <span className="text-[#CCFF00] font-bold text-[10px] uppercase tracking-wider">ACTIVE MESH</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#c4c9ac] leading-relaxed max-w-2xl">
                    Device was detected near current coordinates. Local network signals indicate excellent connectivity. The asset is actively broadcasting its signature.
                  </p>
                </div>
                <button className="w-full bg-[#c3f400] text-black font-bold uppercase tracking-wider text-sm py-5 flex items-center justify-center gap-2 hover:bg-[#b0db00] active:scale-[0.98] transition-all cursor-pointer">
                  <span>Pinpoint & Navigate to Device</span>
                  <span className="material-symbols-outlined text-black font-bold text-lg">near_me</span>
                </button>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={handlePlaySound}
                disabled={playingSound}
                className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between hover:opacity-85 active:scale-95 transition-all text-left cursor-pointer select-none group"
              >
                <div className="w-14 h-14 bg-[#1b1c1d] rounded-full flex items-center justify-center group-hover:bg-[#c3f400]/10 transition-colors">
                  <span className="material-symbols-outlined text-[#CCFF00] text-3xl">
                    {playingSound ? 'volume_mute' : 'volume_up'}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-white font-bold text-lg md:text-xl">{playingSound ? 'Beeping...' : 'Play Sound'}</p>
                  <p className="text-[#c4c9ac] text-sm font-medium mt-1">Locate by audio beep</p>
                </div>
              </button>

              <button 
                onClick={handleSecureDevice}
                disabled={securing || selectedDevice.status === 'Secured'}
                className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col justify-between hover:opacity-85 active:scale-95 transition-all text-left cursor-pointer select-none group"
              >
                <div className="w-14 h-14 bg-[#1b1c1d] rounded-full flex items-center justify-center group-hover:bg-[#CCFF00]/10 transition-colors">
                  <span className="material-symbols-outlined text-[#CCFF00] text-3xl">
                    {selectedDevice.status === 'Secured' ? 'verified_user' : 'lock'}
                  </span>
                </div>
                <div className="mt-6">
                  <p className="text-white font-bold text-lg md:text-xl">
                    {securing ? 'Locking...' : selectedDevice.status === 'Secured' ? 'Device Secured' : 'Secure Device'}
                  </p>
                  <p className="text-[#c4c9ac] text-sm font-medium mt-1">
                    {selectedDevice.status === 'Secured' ? 'Remotely locked & protected' : 'Lock remotely now'}
                  </p>
                </div>
              </button>

            </div>
          ) : (
            <div className="glass-card p-10 rounded-[24px] text-center space-y-4 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-20 h-20 bg-[#1b1c1d] rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                <span className="material-symbols-outlined text-5xl text-[#c4c9ac]/30">smartphone_cool</span>
              </div>
              <h3 className="text-white font-bold text-lg">No Tracked Devices</h3>
              <p className="text-sm text-[#c4c9ac]/60 max-w-sm mx-auto leading-relaxed">
                You haven't registered any devices for tracking. Add your device below to begin network tracking.
              </p>
            </div>
          )}

          {/* Register New Device Form */}
          <div className="glass-card p-6 md:p-8 rounded-[24px] mt-auto border-t-2 border-[#CCFF00]/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00] border border-[#CCFF00]/20">
                <span className="material-symbols-outlined text-2xl">add_to_home_screen</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Register Tracking Node</h3>
                <p className="text-[#c4c9ac] text-sm">Add a tracking node for your device.</p>
              </div>
            </div>

            <form onSubmit={handleAddDevice} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g. Danny's iPhone 15"
                className="flex-grow bg-[#1b1c1d] border border-white/5 rounded-xl px-6 py-4 text-base focus:outline-none focus:border-[#CCFF00] transition-colors text-white placeholder:text-[#c4c9ac]/30 shadow-inner"
              />
              <button
                type="submit"
                disabled={addingDevice}
                className="bg-[#CCFF00] text-black font-bold text-sm px-8 py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-lg shadow-[#CCFF00]/20"
              >
                {addingDevice ? 'Registering...' : 'Register Device'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
