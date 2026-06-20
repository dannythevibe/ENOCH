'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AuthForm from '@/components/AuthForm';
import WelcomeScreen from '@/components/WelcomeScreen';

export default function Home() {
  const [view, setView] = useState<'welcome' | 'auth' | 'app'>('welcome');
  const [loading, setLoading] = useState(true);
  const [authFormMode, setAuthFormMode] = useState<boolean>(true); // true = login, false = register

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setView('app');
    } else {
      setView('welcome');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121314] text-[#c3f400] font-sans font-bold tracking-widest text-xs uppercase">
        Loading ENOCH...
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <WelcomeScreen 
        onGetStarted={() => {
          setAuthFormMode(false); // Go to Register
          setView('auth');
        }}
        onSignIn={() => {
          setAuthFormMode(true); // Go to Login
          setView('auth');
        }}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthForm 
        initialIsLogin={authFormMode}
        onLogin={() => setView('app')}
        onBack={() => setView('welcome')}
      />
    );
  }

  return (
    <AppShell 
      onLogout={() => {
        localStorage.removeItem('token');
        setView('welcome');
      }} 
    />
  );
}
