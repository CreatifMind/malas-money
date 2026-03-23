"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleThemeToggle = () => {
    // Note: This toggles the state, but actual global Light Mode will 
    // require adding 'dark:' prefixes to all our Tailwind classes later!
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    // 1. Call the secure SQL function we just created
    const { error } = await supabase.rpc('delete_user');
    
    if (!error) {
      // 2. Sign out and wipe local storage
      await supabase.auth.signOut();
      localStorage.clear();
      // 3. Kick them back to the login screen
      window.location.href = "/";
    } else {
      alert("Failed to delete account: " + error.message);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500 pb-20">
      
      <header className="mb-6 md:mb-10 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">Manage your preferences and account.</p>
      </header>

      <div className="max-w-3xl mx-auto flex flex-col gap-8 md:gap-10">
        
        {/* PREFERENCES SECTION */}
        <section>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Preferences</h2>
          <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50 shadow-xl">
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-base md:text-lg">App Theme</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1">Toggle between Light and Dark mode.</p>
              </div>
              
              {/* Custom Theme Toggle Switch */}
              <button 
                onClick={handleThemeToggle}
                className={`w-16 h-8 rounded-full transition-all relative flex items-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-sky-400'}`}
              >
                <div className={`absolute w-6 h-6 bg-white rounded-full transition-all shadow-md flex items-center justify-center ${theme === 'dark' ? 'left-9' : 'left-1'}`}>
                  {theme === 'dark' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
                </div>
              </button>
            </div>
            
          </div>
        </section>

        {/* DANGER ZONE SECTION */}
        <section>
          <h2 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 px-2">Danger Zone</h2>
          <div className="bg-rose-500/5 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-rose-500/20 shadow-xl">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="font-bold text-white text-base md:text-lg">Delete Account</p>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-md">
                  Permanently delete your account, investments, transactions, and EPF data. This action cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                Delete Account
              </button>
            </div>

          </div>
        </section>

      </div>

      {/* CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-white text-center mb-2">Are you absolutely sure?</h2>
            <p className="text-slate-400 text-center text-sm mb-8 leading-relaxed">
              This will permanently delete your user profile and wipe all financial data from our servers. You cannot undo this.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50 flex justify-center items-center"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}