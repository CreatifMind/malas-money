"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { useTheme } from "@/components/ThemeProvider";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // NEW: Factory Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const { error } = await supabase.rpc('delete_user');
    
    if (!error) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = "/";
    } else {
      alert("Failed to delete account: " + error.message);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // NEW: Factory Reset Function
  const handleFactoryReset = async () => {
    setIsResetting(true);
    setResetStatus("Initiating wipe...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const userId = session.user.id;

      // 1. Wipe all transactions
      setResetStatus("Deleting transactions...");
      await supabase.from('transactions').delete().eq('user_id', userId);

      // 2. Wipe investments
      setResetStatus("Liquidating portfolio...");
      await supabase.from('investments').delete().eq('user_id', userId);

      // 3. Reset the starting balance back to 0
      setResetStatus("Resetting balances...");
      await supabase.from('profiles').update({ starting_balance: 0 }).eq('id', userId);

      setResetStatus("Wipe Complete!");
      
      // Close the modal and reload the page to clear any cached states
      setTimeout(() => {
        setShowResetModal(false);
        setIsResetting(false);
        setResetStatus("");
        window.location.reload(); 
      }, 1500);

    } catch (error) {
      console.error(error);
      setResetStatus("Error during reset.");
      setIsResetting(false);
    }
  };

  // If not mounted yet, render a skeleton to prevent hydration errors
  if (!mounted) return null;

  return (
    <div className="min-h-full bg-white dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-xl dark:shadow-2xl text-slate-900 dark:text-slate-50 animate-in fade-in duration-500 pb-20 transition-colors duration-300">
      
      <header className="mb-6 md:mb-10 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-base">Manage your preferences and account.</p>
      </header>

      <div className="max-w-3xl mx-auto flex flex-col gap-8 md:gap-10">
        
        {/* PREFERENCES SECTION */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Preferences</h2>
          <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-xl transition-colors duration-300">
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base md:text-lg">App Theme</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Toggle between Light and Dark mode.</p>
              </div>
              
              <button 
                onClick={handleThemeToggle}
                className={`w-16 h-8 rounded-full transition-all duration-300 relative flex items-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md flex items-center justify-center ${theme === 'dark' ? 'left-9' : 'left-1'}`}>
                  {theme === 'dark' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                  )}
                </div>
              </button>
            </div>
            
          </div>
        </section>

        {/* DANGER ZONE SECTION */}
        <section>
          <h2 className="text-sm font-bold text-rose-500 uppercase tracking-widest mb-4 px-2">Danger Zone</h2>
          <div className="bg-rose-50 dark:bg-rose-500/5 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-rose-200 dark:border-rose-500/20 shadow-sm dark:shadow-xl transition-colors duration-300 flex flex-col gap-6">
            
            {/* FACTORY RESET ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-rose-200 dark:border-rose-500/20">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Factory Reset Data</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Wipe all transactions and investments, and reset your balances to zero. Keep your account active.
                </p>
              </div>
              <button 
                onClick={() => setShowResetModal(true)}
                className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-white border border-amber-200 dark:border-amber-500/20 font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                Reset Data
              </button>
            </div>

            {/* DELETE ACCOUNT ROW */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-base md:text-lg">Delete Account</p>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Permanently delete your account, investments, transactions, and EPF data. This action cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-500/20 font-bold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                Delete Account
              </button>
            </div>

          </div>
        </section>

      </div>

      {/* FACTORY RESET MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600 dark:text-amber-400 strokeLinecap-round strokeLinejoin-round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 text-center">Reset all data?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-center">
              This will permanently delete all your logged transactions, investments, and reset your starting balance to zero. You cannot recover this data once it is gone.
            </p>

            {resetStatus && (
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-6 animate-pulse text-center">
                {resetStatus}
              </p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleFactoryReset}
                disabled={isResetting}
                className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
                    Wiping...
                  </>
                ) : (
                  "Yes, wipe it all"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-2xl max-w-md w-full animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white text-center mb-2">Are you absolutely sure?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-8 leading-relaxed">
              This will permanently delete your user profile and wipe all financial data from our servers. You cannot undo this.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
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
