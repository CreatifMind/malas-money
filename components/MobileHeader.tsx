"use client";

interface MobileHeaderProps {
  onOpen: () => void;
}

export default function MobileHeader({ onOpen }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between p-4 bg-[#020617] border-b border-slate-800/50 sticky top-0 z-40">
      <button 
        onClick={onOpen}
        className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <span className="text-emerald-400 font-extrabold tracking-tight">Malas Money</span>
      <div className="w-10"></div> {/* Spacer for symmetry */}
    </header>
  );
}
