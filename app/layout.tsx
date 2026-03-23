"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import { supabase } from "@/utils/supabase";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Navigation State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 1. Listen for Login/Logout events
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Handle Login & Signup
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for the login link!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. THE GATEKEEPER: If no session, ONLY show the Login Screen
  if (!session) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* STRICT VIEWPORT LOCK */}
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        </head>
        {/* Added touch-none and overscroll-none to lock the background */}
        <body className="flex h-screen items-center justify-center bg-[#020617] text-slate-50 antialiased touch-none overscroll-none">
          <div className="bg-[#0B0F19] p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-800/50 max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight mb-2">
                Malas Money
              </h1>
              <p className="text-slate-400 font-medium">Sign in to your financial hub.</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-bold text-slate-500 mb-2 block">Email address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-500 mb-2 block">Your Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
                />
              </div>

              <button 
                type="submit" 
                disabled={authLoading} 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 mt-2 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] disabled:opacity-50"
              >
                {authLoading ? "Authenticating..." : isSignUp ? "Sign Up" : "Sign In"}
              </button>

              {authError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl text-center font-medium">
                  {authError}
                </div>
              )}
            </form>
            
            <div className="mt-8 flex flex-col items-center gap-3 text-sm">
              <button className="text-slate-500 hover:text-slate-300 transition-colors">
                Forgot your password?
              </button>
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }} 
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </body>
      </html>
    );
  }

  // 4. THE APP: If logged in, show the Dashboard Layout
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* STRICT VIEWPORT LOCK */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      {/* Added touch-none and overscroll-none to lock the app wrapper from bouncing/zooming */}
      <body suppressHydrationWarning className="flex h-screen bg-[#020617] text-slate-50 antialiased overflow-hidden touch-none overscroll-none">
        {/* Pass state to Sidebar */}
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Mobile Header triggers the open state */}
          <MobileHeader onOpen={() => setIsMenuOpen(true)} />
          
          {/* Re-enabled safe vertical scrolling here with touch-pan-y */}
          <main className="flex-1 overflow-y-auto touch-pan-y overscroll-none pb-[env(safe-area-inset-bottom)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
