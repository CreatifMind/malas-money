"use client";

import Link from "next/link";
import { supabase } from "@/utils/supabase";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleLogout = async () => {
    console.log("Signing out...");
    await supabase.auth.signOut();
    window.location.href = "/"; 
  };

  return (
    <>
      {/* 1. The Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 2. The Actual Sidebar Drawer */}
      <aside className={`
        fixed md:relative z-50 h-full w-72 
        bg-white/90 dark:bg-slate-950/90 md:bg-white/50 md:dark:bg-slate-950/50 
        backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800/50 
        text-slate-600 dark:text-slate-300 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 tracking-tight">
            Malas Money
          </h2>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">✕</button>
        </div>
        
        <nav className="flex flex-col gap-2 px-4 mt-6 flex-1">
          {[
            { name: "Dashboard", path: "/", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
            { name: "Transactions", path: "/transactions", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
            { name: "Savings Goals", path: "/goals", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 18c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z M12 12h.01" },
            { name: "Portfolio", path: "/portfolio", icon: "M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" },
            { name: "Deductions", path: "/deductions", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
            { name: "EPF Vault", path: "/epf", icon: "M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
            { name: "Settings", path: "/settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.path} 
              onClick={onClose}
              className="px-4 py-3.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-semibold flex items-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 mb-4">
          <button onClick={handleLogout} className="w-full px-4 py-3.5 text-left text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all flex items-center gap-3 font-semibold">
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
