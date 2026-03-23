"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function SavingsGoals() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("");

  const [goals, setGoals] = useState<any[]>([]);
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});
  
  const [liquidCash, setLiquidCash] = useState(0);

  useEffect(() => { 
    fetchGoals(); 
    fetchLiquidCash();
  }, []);

  const fetchLiquidCash = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const [profileRes, txRes] = await Promise.all([
      supabase.from('profiles').select('starting_balance').eq('id', session.user.id).single(),
      supabase.from('transactions').select('*')
    ]);

    const baseAmount = profileRes.data?.starting_balance || 0;
    let totalIncome = 0; let totalExpense = 0;
    
    if (txRes.data) {
      txRes.data.forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") totalExpense += Number(tx.amount);
      });
    }
    setLiquidCash(baseAmount + totalIncome - totalExpense);
  };

  const fetchGoals = async () => {
    const { data } = await supabase.from("goals").select("*").order("target_date", { ascending: true });
    if (data) setGoals(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Securing Target...");
    const { error } = await supabase.from("goals").insert([{
        name, target_amount: parseFloat(targetAmount), target_date: targetDate, current_amount: 0 
    }]);
    if (!error) {
      setStatus("Success"); setName(""); setTargetAmount(""); setTargetDate("");
      fetchGoals(); setTimeout(() => setStatus(""), 2000);
    } else setStatus("Error: " + error.message);
  };

  const handleAddFunds = async (goalId: string, goalName: string, currentAmount: number) => {
    const amountToAdd = parseFloat(fundAmounts[goalId] || "0");
    if (amountToAdd <= 0) return;
    
    if (amountToAdd > liquidCash) {
      alert("Insufficient Liquid Cash to fund this goal.");
      return;
    }

    await supabase.from("goals").update({ current_amount: currentAmount + amountToAdd }).eq("id", goalId);
    await supabase.from("transactions").insert([{
      amount: amountToAdd, category: `Savings Goal: ${goalName}`, type: "expense",
      description: "Auto-transfer to savings", date: new Date().toISOString().split('T')[0]
    }]);

    setFundAmounts({ ...fundAmounts, [goalId]: "" });
    fetchGoals();
    fetchLiquidCash(); 
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-xl dark:shadow-2xl text-slate-900 dark:text-slate-50 animate-in fade-in duration-500 pb-20 transition-colors duration-300">
      
      <header className="mb-6 md:mb-10 px-2 md:px-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Savings Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-base transition-colors duration-300">Visualize your financial targets.</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 md:px-5 py-2 md:py-3 rounded-2xl text-right animate-in zoom-in-95 transition-colors duration-300">
          <p className="text-[9px] md:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Available Cash</p>
          <p className="text-base md:text-xl font-extrabold text-emerald-500 dark:text-emerald-300">RM {liquidCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 relative overflow-hidden transition-colors duration-300">
             <div className="absolute -top-20 -left-20 w-48 md:w-64 h-48 md:h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-10 dark:opacity-20 transition-colors duration-300"></div>
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-white relative z-10 transition-colors duration-300">Set New Target</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5 relative z-10">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all text-sm md:text-base" placeholder="Goal Name (e.g., Japan Trip)" />
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm md:text-base">RM</div>
                 <input type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full pl-12 p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all text-sm md:text-base" placeholder="Target Amount" />
              </div>
              <input type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-all dark:[color-scheme:dark] text-sm md:text-base" />
              <button type="submit" className="mt-2 md:mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 md:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-[0.98] text-sm md:text-base">
                {status || "Start Saving"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-slate-50 dark:bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/30 h-full transition-colors duration-300">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-white transition-colors duration-300">Your Active Targets</h2>
            <div className="flex flex-col gap-4 md:gap-6">
              {goals.map((goal) => {
                const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
                return (
                  <div key={goal.id} className="bg-white dark:bg-slate-900/50 p-5 md:p-6 rounded-[1.5rem] md:rounded-3xl border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40 shadow-sm dark:shadow-none transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-full bg-blue-500/5 blur-2xl"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-wide pr-2 transition-colors duration-300">{goal.name}</h3>
                      </div>
                      <div className="text-right flex items-center gap-2 md:gap-4">
                        <p className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">{percentage}%</p>
                        <button onClick={() => handleDelete(goal.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-950/80 rounded-full h-3 md:h-4 mb-5 border border-slate-200 dark:border-slate-800/80 relative z-10 transition-colors duration-300">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-600 dark:to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] dark:shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ width: `${percentage}%` }}></div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 relative z-10 transition-colors duration-300">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                         <input type="number" placeholder="RM Amount" value={fundAmounts[goal.id] || ""} onChange={(e) => setFundAmounts({...fundAmounts, [goal.id]: e.target.value})} className="flex-1 sm:w-32 p-2.5 md:p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-transparent rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-xs md:text-sm transition-colors duration-300" />
                         <button onClick={() => handleAddFunds(goal.id, goal.name, goal.current_amount)} className="bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white px-3 md:px-4 py-2.5 md:py-2 rounded-lg transition-colors text-xs md:text-sm font-bold whitespace-nowrap">Add</button>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto flex flex-row justify-between sm:block text-xs md:text-sm">
                        <span>RM {Number(goal.current_amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1 hidden sm:inline">/</span>
                        <span className="text-slate-400 dark:text-slate-500">RM {Number(goal.target_amount).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                 <p className="text-center text-slate-500 py-8 font-medium">No active targets set.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
