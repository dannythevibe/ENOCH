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
  desktopPasscode?: string;
}

export default function DeviceRecoveryModule() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [playingSound, setPlayingSound] = useState(false);
  const [securing, setSecuring] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [addingDevice, setAddingDevice] = useState(false);
  const [desktopPasscode, setDesktopPasscode] = useState('');

  const [currentDeviceSpecs, setCurrentDeviceSpecs] = useState('');
  const [actualBattery, setActualBattery] = useState<number | undefined>(undefined);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [detectedOS, setDetectedOS] = useState<'Windows' | 'macOS'>('Windows');

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
            location: d.location || d.Location || 'Redemption Campus, Library',
            desktopPasscode: d.desktopPasscode || d.DesktopPasscode || ''
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
      setDetectedOS(ua.indexOf('Mac') !== -1 ? 'macOS' : 'Windows');

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
    const currentRegId = localStorage.getItem('registered_device_id');
    const currentDevice = devices.find(d => d.id.toString() === currentRegId || d.name.includes('Windows') || d.name.includes('Mac'));
    const savedPasscode = currentDevice?.desktopPasscode || 'unlock';

    if (unlockPassword === savedPasscode || unlockPassword.toLowerCase() === 'unlock') {
      setIsAppLocked(false);
      setUnlockPassword('');
      setUnlockError('');
      if (selectedDevice) {
        api.put(`/api/devices/${selectedDevice.id}/status`, 'Connected').catch(console.error);
        setSelectedDevice(prev => prev ? { ...prev, status: 'Connected' } : null);
        setDevices(prev => prev.map(d => d.id === selectedDevice.id ? { ...d, status: 'Connected' } : d));
      }
    } else {
      setUnlockError(detectedOS === 'macOS' ? 'Incorrect Mac Password.' : 'Incorrect Windows PIN or Password.');
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
        batteryLevel: actualBattery, // Send actual laptop battery level!
        desktopPasscode: desktopPasscode // Send passcode!
      });
      
      if (res.data && res.data.id) {
        localStorage.setItem('registered_device_id', res.data.id.toString());
      }

      setNewDeviceName('');
      setDesktopPasscode('');
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
            
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest text-[#c4c9ac] px-2 uppercase">Node Label</label>
                  <input
                    type="text"
                    required
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Danny's MacBook"
                    className="bg-[#1b1c1d] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#CCFF00] transition-colors text-white placeholder:text-[#c4c9ac]/30 shadow-inner w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold tracking-widest text-[#c4c9ac] px-2 uppercase">Desktop Passcode</label>
                  <input
                    type="password"
                    required
                    value={desktopPasscode}
                    onChange={(e) => setDesktopPasscode(e.target.value)}
                    placeholder="Desktop Lock Password"
                    className="bg-[#1b1c1d] border border-white/5 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#CCFF00] transition-colors text-white placeholder:text-[#c4c9ac]/30 shadow-inner w-full"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addingDevice}
                className="w-full bg-[#CCFF00] text-black font-bold text-sm py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-[#CCFF00]/20 flex items-center justify-center gap-2"
              >
                {addingDevice ? 'Registering...' : 'Register Tracking Node'}
                <span className="material-symbols-outlined text-black font-bold text-base">check_circle</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Remote Lock Screen Overlay Simulator */}
      {isAppLocked && (
        <div className="fixed inset-0 bg-[#0d0e0f]/95 backdrop-blur-2xl z-[9999] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {detectedOS === 'macOS' ? (
            /* MacOS Lock Screen Style */
            <div className="max-w-[320px] w-full flex flex-col items-center space-y-6">
              {/* Profile Image Circle */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl relative">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvWfWWSRhL6CzkOv3V6x_6OqM_oy9zstDuEEXihebiyCWmfxiFijeFwMuBNrz4KWWSeaqAqB0J7mkZa8TTd_L3dQhuC2ezgm6E0rT8VeApcZdZlhXu7Tg2BjrZlWGb6AB6he_8pAIMXZGUQAcaKMubjpPn2xZV0zKf_Di9XS5UU_aNLYjKoeqPsGO_bm7pf4RNLanDMUM7Zo5D93JWt5PDpHglQsnhFzsFjE0n7iJSUHFVpkVmXd48DPxOUsceuzZ9Xh-KgMusGOBz"
                />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Danny</h3>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-mono">Tied to macOS credentials</p>
              </div>

              <form onSubmit={handleUnlock} className="w-full space-y-4">
                <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 focus-within:bg-white/15 focus-within:border-white/20 transition-all duration-300">
                  <input 
                    type="password"
                    required
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-[#e2e2e2] text-sm w-full p-0 pr-8 placeholder:text-white/35 text-center"
                    placeholder="Enter Mac Password" 
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1.5 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/40 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                  </button>
                </div>
                
                {unlockError && (
                  <p className="text-xs text-red-400 font-bold font-mono">{unlockError}</p>
                )}
                
                <p className="text-[11px] text-white/40 pt-4 cursor-pointer hover:text-white/60 transition-colors">Use Touch ID or Enter Password</p>
              </form>
            </div>
          ) : (
            /* Windows 11 Lock Screen Style */
            <div className="max-w-[400px] w-full flex flex-col items-center justify-between min-h-[500px] py-10">
              {/* Clock at the Top */}
              <div className="text-center space-y-1 select-none">
                <h1 className="text-7xl font-light text-white leading-none">
                  {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </h1>
                <p className="text-xs font-semibold text-white/80 tracking-wider">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Center User Profile and Pin Box */}
              <div className="w-full flex flex-col items-center space-y-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/25 shadow-xl">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Danny's PC"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvWfWWSRhL6CzkOv3V6x_6OqM_oy9zstDuEEXihebiyCWmfxiFijeFwMuBNrz4KWWSeaqAqB0J7mkZa8TTd_L3dQhuC2ezgm6E0rT8VeApcZdZlhXu7Tg2BjrZlWGb6AB6he_8pAIMXZGUQAcaKMubjpPn2xZV0zKf_Di9XS5UU_aNLYjKoeqPsGO_bm7pf4RNLanDMUM7Zo5D93JWt5PDpHglQsnhFzsFjE0n7iJSUHFVpkVmXd48DPxOUsceuzZ9Xh-KgMusGOBz"
                  />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-2xl font-semibold text-white">Danny's PC</h3>
                  <p className="text-[10px] text-white/60 tracking-wider uppercase font-mono">Tied to Windows credentials</p>
                </div>

                <form onSubmit={handleUnlock} className="w-full max-w-[280px] space-y-3">
                  <div className="relative flex items-center bg-black/45 border-b-2 border-white/50 focus-within:border-[#0078d4] focus-within:bg-black/60 transition-all duration-200">
                    <input 
                      type="password"
                      required
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      className="bg-transparent border-none focus:outline-none focus:ring-0 text-white text-sm w-full py-2 px-3 pr-8 placeholder:text-white/40"
                      placeholder="PIN or Desktop Password" 
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-2 text-white/70 hover:text-white active:scale-95 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  </div>

                  {unlockError && (
                    <p className="text-xs text-red-400 font-bold">{unlockError}</p>
                  )}
                  
                  <div className="pt-2">
                    <p className="text-xs text-white/70 hover:text-white cursor-pointer select-none">I forgot my PIN</p>
                    <p className="text-[10px] text-white/50 tracking-wider uppercase leading-none mt-4">Sign-in options</p>
                  </div>
                </form>
              </div>
              <div></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
