'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  profilePictureUrl?: string;
}

interface ProfileModuleProps {
  onLogout?: () => void;
}

export default function ProfileModule({ onLogout }: ProfileModuleProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/api/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.profilePictureUrl) {
        setUser(prev => prev ? { ...prev, profilePictureUrl: res.data.profilePictureUrl } : null);
      }
    } catch (err) {
      console.error('Failed to upload picture', err);
      alert('Failed to upload picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-6 pb-28 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-center w-full py-2 z-20">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Account & Settings</h2>
          <p className="text-xs md:text-sm text-[#c4c9ac] font-medium mt-1">Manage your identity, preferences, and system access.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: User Identity Card */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-8 rounded-[24px] flex flex-col items-center text-center space-y-4">
            <div 
              onClick={handleAvatarClick}
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#CCFF00]/20 relative shadow-[0_0_30px_rgba(204,255,0,0.15)] cursor-pointer group"
            >
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-[#CCFF00] animate-spin">sync</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-white">photo_camera</span>
              </div>
              <img 
                className="w-full h-full object-cover" 
                alt="Profile Avatar"
                src={user?.profilePictureUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDvWfWWSRhL6CzkOv3V6x_6OqM_oy9zstDuEEXihebiyCWmfxiFijeFwMuBNrz4KWWSeaqAqB0J7mkZa8TTd_L3dQhuC2ezgm6E0rT8VeApcZdZlhXu7Tg2BjrZlWGb6AB6he_8pAIMXZGUQAcaKMubjpPn2xZV0zKf_Di9XS5UU_aNLYjKoeqPsGO_bm7pf4RNLanDMUM7Zo5D93JWt5PDpHglQsnhFzsFjE0n7iJSUHFVpkVmXd48DPxOUsceuzZ9Xh-KgMusGOBz"}
              />
              <div className="absolute inset-0 rounded-full ring-2 ring-inset ring-[#CCFF00] opacity-50"></div>
            </div>
            
            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{user ? user.fullName : 'Loading...'}</h1>
              <p className="text-sm text-[#c4c9ac] font-medium">{user ? user.email : '...'}</p>
            </div>

            <div className="flex gap-2 mt-2">
              <span className="bg-[#1b1c1d] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10">Redemption City</span>
            </div>

            <div className="w-full pt-4 mt-2 border-t border-white/5">
              {onLogout && (
                <button 
                  onClick={onLogout}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm px-6 py-3.5 rounded-xl border border-red-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* Preferences Bento */}
          <div className="glass-card overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#CCFF00]">tune</span>
                App Preferences
              </h3>
              <p className="text-sm text-[#c4c9ac] mt-1">Customize your UI and system behavior.</p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">Push Notifications</h4>
                  <p className="text-xs text-[#c4c9ac] mt-0.5">Receive alerts for device tracking and mesh updates.</p>
                </div>
                <button 
                  className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none cursor-pointer bg-[#CCFF00]"
                >
                  <span className="inline-block h-6 w-6 transform rounded-full bg-black transition-transform translate-x-7" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
