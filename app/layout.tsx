"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [session, setSession] = useState<any>(null); // Keep your existing session logic here

  // ... (Keep your existing useEffect for session tracking)

  if (!session) {
    // ... (Keep your existing Auth login screen here)
  }

  return (
    <html lang="en">
      <body className="flex h-screen bg-[#020617] text-slate-50 antialiased overflow-hidden">
        {/* Pass state to Sidebar */}
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          {/* Mobile Header triggers the open state */}
          <MobileHeader onOpen={() => setIsMenuOpen(true)} />
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
