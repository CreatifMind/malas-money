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
    // This forces a full refresh to clear any "ghost" data and return to login
    window.location.href = "/"; 
  };

  return (
    <>
      {/* 1. The Backdrop (Darkens the background when menu is open) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 2. The Actual Sidebar Drawer */}
      <aside className={`
        fixed md:relative z-50 h-full w-72 bg-slate-950/90 md:bg-slate-950/50 backdrop-blur-2xl border-r border-slate-800/50 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4 flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
            Malas Money
          </h2>
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white">✕</button>
        </div>
        
        <nav className="flex flex-col gap-2 px-4 mt-6 flex-1">
          {[
            { name: "Dashboard", path: "/", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
            { name: "Transactions", path: "/transactions", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
            { name: "Savings Goals", path: "/goals", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" },
            { name: "Portfolio", path: "/portfolio", icon: "M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" },
            { name: "EPF Vault", path: "/epf", icon: "M2 7h20v14H2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.path} 
              onClick={onClose}
              className="px-4 py-3.5 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-400 transition-all font-semibold flex items-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 mb-4">
          <button onClick={handleLogout} className="w-full px-4 py-3.5 text-left text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all flex items-center gap-3 font-semibold">
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
