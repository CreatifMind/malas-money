"use client";

import Link from "next/link";
import { supabase } from "@/utils/supabase";

export default function Sidebar() {
  const handleLogout = async () => await supabase.auth.signOut();

  return (
    <aside className="w-72 bg-slate-950/50 backdrop-blur-2xl border-r border-slate-800/50 text-slate-300 flex flex-col h-full relative z-20">
      <div className="p-8 pb-4">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
          Malas Money
        </h2>
      </div>
      
      <nav className="flex flex-col gap-2 px-4 mt-6 flex-1">
        <Link href="/" className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          Dashboard
        </Link>
        <Link href="/transactions" className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          Transactions
        </Link>
        <Link href="/goals" className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Savings Goals
        </Link>
        <Link href="/portfolio" className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
          Portfolio
        </Link>
        <Link href="/epf" className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold tracking-wide flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          EPF Vault
        </Link>
      </nav>

      <div className="p-4 mb-4">
        <button onClick={handleLogout} className="w-full px-4 py-3.5 text-left text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all flex items-center gap-3 font-semibold tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
