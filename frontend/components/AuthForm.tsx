'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';

export default function AuthForm({ 
  onLogin, 
  onBack,
  initialIsLogin = true 
}: { 
  onLogin: () => void; 
  onBack: () => void;
  initialIsLogin?: boolean;
}) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        onLogin();
      } else {
        await api.post('/api/auth/register', { email, password, fullName });
        // Auto login after registration
        const res = await api.post('/api/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        onLogin();
      }
    } catch (err: any) {
      setError(err.response?.data || 'An error occurred. Check your network or credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#121314] text-[#e2e2e2] font-sans relative overflow-hidden">
      {/* Header / Branding */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-md mx-auto">
        <div 
          onClick={onBack}
          className="flex items-center gap-2 cursor-pointer hover:opacity-85 select-none group"
        >
          <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">arrow_back</span>
          <img src="/enoch-logo.png" alt="ENOCH Logo" className="h-8 object-contain" />
        </div>
        <div className="w-10 h-10 rounded-full border border-[#444933]/30 flex items-center justify-center hover:bg-[#1f2021] transition-colors cursor-pointer text-[#c4c9ac]">
          <span className="material-symbols-outlined">help_outline</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pb-12 relative z-10 max-w-md mx-auto w-full">
        {/* Welcome Header */}
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {isLogin ? 'Welcome back' : 'Create Account'}
          </h1>
          <p className="text-sm text-[#c4c9ac] mt-1 font-medium">
            {isLogin ? 'Sign in to access your offline guide' : 'Create your identity'}
          </p>
        </div>

        {error && (
          <div className="w-full p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold tracking-widest text-[#c4c9ac] px-4 uppercase">Full Name</label>
              <div className="flex items-center bg-[#1b1c1d] border border-transparent rounded-full px-5 py-3.5 focus-within:border-[#c3f400] focus-within:shadow-[0_0_15px_rgba(195,244,0,0.15)] transition-all duration-300">
                <span className="material-symbols-outlined text-[#c4c9ac] mr-3">person</span>
                <input 
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 text-[#e2e2e2] w-full p-0 text-base placeholder:text-[#c4c9ac]/30"
                  placeholder="John Doe" 
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-[#c4c9ac] px-4 uppercase">Email</label>
            <div className="flex items-center bg-[#1b1c1d] border border-transparent rounded-full px-5 py-3.5 focus-within:border-[#c3f400] focus-within:shadow-[0_0_15px_rgba(195,244,0,0.15)] transition-all duration-300">
              <span className="material-symbols-outlined text-[#c4c9ac] mr-3">mail</span>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-[#e2e2e2] w-full p-0 text-base placeholder:text-[#c4c9ac]/30"
                placeholder="name@enoch.digital" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold tracking-widest text-[#c4c9ac] px-4 uppercase">Password</label>
            <div className="flex items-center bg-[#1b1c1d] border border-transparent rounded-full px-5 py-3.5 focus-within:border-[#c3f400] focus-within:shadow-[0_0_15px_rgba(195,244,0,0.15)] transition-all duration-300">
              <span className="material-symbols-outlined text-[#c4c9ac] mr-3">lock</span>
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-[#e2e2e2] w-full p-0 text-base placeholder:text-[#c4c9ac]/30"
                placeholder="••••••••" 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-[#c4c9ac] hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {isLogin && (
              <div className="flex justify-end px-4">
                <a className="text-xs font-bold text-[#abd600] hover:opacity-85" href="#">Forgot Password?</a>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#c3f400] text-black font-bold text-lg py-4 rounded-full hover:shadow-[0_0_20px_rgba(195,244,0,0.3)] active:scale-98 transition-all duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <span className="material-symbols-outlined font-bold">arrow_forward</span>
          </button>
        </form>

        {/* Toggle Switch */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-[#c4c9ac] hover:text-[#c3f400] transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </main>

      {/* Footer Security / Status Badge */}
      <footer className="relative z-10 w-full py-6 flex flex-col items-center gap-4 max-w-md mx-auto">
        <div className="flex gap-6">
          <a className="text-xs font-semibold text-[#c4c9ac] opacity-50 hover:opacity-100 transition-opacity" href="#">Privacy Policy</a>
          <a className="text-xs font-semibold text-[#c4c9ac] opacity-50 hover:opacity-100 transition-opacity" href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
