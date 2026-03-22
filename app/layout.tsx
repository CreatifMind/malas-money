"use client";

import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <html lang="en">
        {/* Dark Background for Auth */}
        <body className="flex h-screen bg-[#020617] items-center justify-center antialiased relative overflow-hidden">
          {/* Ambient Background Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/50 relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">Malas Money</h1>
              <p className="text-slate-400 mt-3 font-medium">Sign in to your financial hub.</p>
            </div>
            <Auth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                variables: { default: { colors: { brand: '#10b981', brandAccent: '#059669', inputText: 'white' } } },
                className: { input: 'bg-slate-950/50 border-slate-800 text-white rounded-xl', button: 'rounded-xl font-bold tracking-wide' }
              }}
              theme="dark"
              providers={[]}
            />
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      {/* Global Dark Background for the App */}
      <body className="flex h-screen bg-[#020617] text-slate-50 antialiased selection:bg-emerald-500/30">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
