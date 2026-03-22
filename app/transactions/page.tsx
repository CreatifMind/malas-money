"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function Transactions() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [status, setStatus] = useState("");
  
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(10);
    if (data) setRecentTransactions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Processing...");

    const finalCategory = type === "income" ? "General Income" : category;

    const { error } = await supabase.from("transactions").insert([{
      amount: parseFloat(amount),
      category: finalCategory, 
      type, 
      description: type === "income" ? (isRecurring ? "Recurring Income" : "One-time Income") : description, 
      date,
    }]);

    if (!error) {
      setStatus("Success");
      setAmount(""); setCategory(""); setDescription(""); setIsRecurring(false);
      fetchTransactions();
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Error: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) setRecentTransactions(recentTransactions.filter(tx => tx.id !== id));
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[2.5rem] p-8 m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500">
      <header className="mb-10 px-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">Transactions</h1>
        <p className="text-slate-400 mt-1 font-medium italic">
          {type === 'income' ? 'Logging an inflow of cash...' : 'Logging an outflow of cash...'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: The Interactive Log Form */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden transition-all duration-700">
            
            {/* DYNAMIC AMBIENT GLOW */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transition-all duration-700 ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col">
              
              {/* Type Switcher */}
              <div className="flex p-1.5 bg-slate-950/50 backdrop-blur-md rounded-2xl mb-10 border border-slate-800/50">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${type === 'expense' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
                   Expense
                </button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${type === 'income' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
                   Income
                </button>
              </div>

              {/* Amount Input */}
              <div className="text-center mb-10">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-[0.2em]">Amount</p>
                <div className="flex items-center justify-center text-6xl font-extrabold text-white">
                  <span className={`mr-2 transition-colors duration-500 ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>RM</span>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none w-2/3 text-center focus:ring-0 p-0 placeholder-slate-800" placeholder="0.00" />
                </div>
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-4 mb-8">
                {type === 'expense' ? (
                  <>
                    <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-white placeholder-slate-600" placeholder="Category (e.g., Food)" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-white placeholder-slate-600" placeholder="Note (Optional)" />
                  </>
                ) : (
                  <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-emerald-400">Set as Recurring Monthly Income?</span>
                    <button 
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-800'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                )}
                
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none transition-all text-white [color-scheme:dark] ${type === 'income' ? 'focus:border-emerald-500/50' : 'focus:border-rose-500/50'}`} />
              </div>

              {/* DYNAMIC ACTION BUTTON */}
              <button 
                type="submit" 
                className={`w-full font-extrabold py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] ${
                  type === 'income' 
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' 
                  : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'
                }`}
              >
                {status || (type === 'income' ? 'Deposit Funds' : 'Log Expense')}
              </button>
            </form>
          </div>
        </div>

        {/* History Feed */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/30 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/30 h-full">
            <h2 className="text-xl font-bold mb-6 text-white">Recent History</h2>
            <ul className="space-y-3">
              {recentTransactions.map((tx) => (
                <li key={tx.id} className="p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl flex justify-between items-center group hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {tx.type === 'expense' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="font-bold text-white tracking-wide">{tx.category}</p>
                      <p className="text-xs text-slate-500 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold tabular-nums ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'expense' ? '- ' : '+ '}RM {tx.amount.toFixed(2)}
                    </span>
                    <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
