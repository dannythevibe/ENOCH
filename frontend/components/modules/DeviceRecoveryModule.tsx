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

  const [currentDeviceSpecs, setCurrentDeviceSpecs] = useState('');
  const [actualBattery, setActualBattery] = useState<number | undefined>(undefined);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  const fetchDevices = async () => {
    try {
      const res = await api.get('/api/devices');
      if (res.data) {
        // Query current battery level if available
        let percentage: number | undefined = undefined;
        if (typeof window !== 'undefined' && 'getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          percentage = Math.round(battery.level * 100);
        }

        const apiDevices = res.data.map((d: any) => {
          const deviceId = d.id || d.Id;
          const deviceName = d.name || d.Name;
          const isCurrentDevice = localStorage.getItem('registered_device_id') === deviceId.toString() || 
                                  deviceName.includes('Windows') || 
                                  deviceName.includes('MacBook') || 
                                  deviceName.includes('Mac');
          
          return {
            id: deviceId,
            name: deviceName,
            battery: isCurrentDevice && percentage !== undefined ? percentage : (d.batteryLevel || d.BatteryLevel || 85),
            status: d.status || d.Status || 'Connected',
            lastSeen: 'Just now',
            location: d.location || d.Location || 'Redemption Campus, Library'
          };
        });

        setDevices(apiDevices);

        // Lock terminal locally on load if current registered device is secured
        const foundCurrent = apiDevices.find((x: any) => {
          const isCurrent = localStorage.getItem('registered_device_id') === x.id.toString() || 
                            x.name.includes('Windows') || 
                            x.name.includes('MacBook') || 
                            x.name.includes('Mac');
          return isCurrent;
        });
        if (foundCurrent && foundCurrent.status === 'Secured') {
          setIsAppLocked(true);
        }

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
    
    // Extract Device Specs & Live Battery Percentage
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const platform = window.navigator.platform;
      const cores = window.navigator.hardwareConcurrency ? `${window.navigator.hardwareConcurrency} Cores` : '';
      const memory = (window.navigator as any).deviceMemory ? `${(window.navigator as any).deviceMemory}GB RAM` : '';
      
      let os = 'Windows Laptop';
      if (ua.indexOf('Mac') !== -1) os = 'MacBook';
      if (ua.indexOf('Linux') !== -1) os = 'Linux Machine';
      if (ua.indexOf('Android') !== -1) os = 'Android Phone';
      if (ua.indexOf('like Mac') !== -1) os = 'iPhone';

      const specs = `${os} (${platform}) ${cores ? '• ' + cores : ''} ${memory ? '• ' + memory : ''}`;
      setCurrentDeviceSpecs(specs);
      setNewDeviceName(`Danny's ${os}`);

      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setActualBattery(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => {
            setActualBattery(Math.round(battery.level * 100));
          });
        });
      }
    }
  }, []);

  const handlePlaySound = () => {
    if (!selectedDevice) return;
    setPlayingSound(true);
    
    // Synthesize real high-pitched device locator beeps
    try {
      const AudioCtxClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass();
        let time = ctx.currentTime;
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2500, time);
          
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(time);
          osc.stop(time + 0.4);
          
          time += 0.8;
        }
      }
    } catch(e) { console.error('Beep audio failed:', e); }

    setTimeout(() => setPlayingSound(false), 3000);
  };

  const handleSecureDevice = async () => {
    if (!selectedDevice) return;
    setSecuring(true);
    try {
      await api.put(`/api/devices/${selectedDevice.id}/status`, 'Secured');
      setSelectedDevice(prev => prev ? { ...prev, status: 'Secured' } : null);
      setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Secured' } : d));
      
      const isCurrent = localStorage.getItem('registered_device_id') === selectedDevice.id.toString() || 
                        selectedDevice.name.includes('Windows') || 
                        selectedDevice.name.includes('MacBook') || 
                        selectedDevice.name.includes('Mac');
      if (isCurrent) {
        setTimeout(() => {
          setIsAppLocked(true);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to secure device:', err);
    } finally {
      setTimeout(() => setSecuring(false), 2000);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPassword.toLowerCase() === 'unlock' || unlockPassword.length > 2) {
      setIsAppLocked(false);
      setUnlockPassword('');
      setUnlockError('');
      if (selectedDevice) {
        api.put(`/api/devices/${selectedDevice.id}/status`, 'Connected').catch(console.error);
        setSelectedDevice(prev => prev ? { ...prev, status: 'Connected' } : null);
        setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Connected' } : d));
      }
    } else {
      setUnlockError('Invalid authorization credentials.');
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

      const res = await api.post('/api/devices', {
        name: newDeviceName,
        macAddress: mockMac,
        batteryLevel: actualBattery // Send actual laptop battery level!
      });
      
      if (res.data && res.data.id) {
        localStorage.setItem('registered_device_id', res.data.id.toString());
      }

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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00] border border-[#CCFF00]/20">
                <span className="material-symbols-outlined text-2xl">add_to_home_screen</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Register Tracking Node</h3>
                <p className="text-[#c4c9ac] text-sm">Add a tracking node for your device.</p>
              </div>
            </div>
            
            {currentDeviceSpecs && (
              <div className="mb-6 bg-[#1b1c1d] p-3 rounded-xl border border-white/5 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#CCFF00] text-sm">memory</span>
                <span className="text-[11px] text-[#c4c9ac] font-bold tracking-wider uppercase">{currentDeviceSpecs}</span>
              </div>
            )}

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

      {/* Remote Lock Screen Overlay Simulator */}
      {isAppLocked && (
        <div className="fixed inset-0 bg-[#0d0e0f]/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="max-w-md w-full glass-card p-8 rounded-[32px] border-t-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner mx-auto">
              <span className="material-symbols-outlined text-5xl text-red-500 animate-pulse">lock</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">DEVICE SECURED REMOTELY</h2>
              <p className="text-xs text-[#c4c9ac] font-bold tracking-widest uppercase font-mono">ENOCH Mesh Defense Active</p>
              <p className="text-sm text-[#c4c9ac] leading-relaxed pt-2">
                This client terminal has been locked remotely via the ENOCH asset protection coordinator. All inputs and navigation routes are frozen.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4 pt-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold tracking-widest text-[#c4c9ac] px-4 uppercase">UNLOCK AUTHORIZATION</label>
                <div className="flex items-center bg-[#1b1c1d] border border-transparent rounded-full px-5 py-3.5 focus-within:border-red-500 focus-within:shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300">
                  <span className="material-symbols-outlined text-[#c4c9ac] mr-3">lock_open</span>
                  <input 
                    type="password"
                    required
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-[#e2e2e2] w-full p-0 text-base placeholder:text-[#c4c9ac]/30"
                    placeholder="Enter account password (or 'unlock')" 
                  />
                </div>
                {unlockError && (
                  <p className="text-xs text-red-400 font-bold mt-1 px-4">{unlockError}</p>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold text-base py-4 rounded-full hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] active:scale-98 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Authorize & Unlock</span>
                <span className="material-symbols-outlined font-bold text-lg">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
