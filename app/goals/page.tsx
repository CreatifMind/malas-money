"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function SavingsGoals() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("");

  const [goals, setGoals] = useState<any[]>([]);
  // NEW: Track funding amounts for each specific goal
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});

  useEffect(() => { fetchGoals(); }, []);

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

  // NEW: Double-Entry Logic to Add Funds & Deduct Liquid Cash
  const handleAddFunds = async (goalId: string, goalName: string, currentAmount: number) => {
    const amountToAdd = parseFloat(fundAmounts[goalId] || "0");
    if (amountToAdd <= 0) return;

    // 1. Update the Goal Progress
    await supabase.from("goals").update({ current_amount: currentAmount + amountToAdd }).eq("id", goalId);

    // 2. The Magic: Auto-log an expense so Liquid Cash goes down!
    await supabase.from("transactions").insert([{
      amount: amountToAdd,
      category: `Savings Goal: ${goalName}`,
      type: "expense",
      description: "Auto-transfer to savings",
      date: new Date().toISOString().split('T')[0] // Today's date
    }]);

    // Clear input and refresh
    setFundAmounts({ ...fundAmounts, [goalId]: "" });
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[2.5rem] p-8 m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500">
      <header className="mb-10 flex justify-between items-end px-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Savings Goals</h1>
          <p className="text-slate-400 mt-1 font-medium">Visualize your financial targets.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Create Form */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden">
             <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
            <h2 className="text-xl font-bold mb-8 text-white relative z-10">Set New Target</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white placeholder-slate-600 transition-all" placeholder="Goal Name (e.g., Japan Trip)" />
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 font-bold">RM</div>
                 <input type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full pl-12 p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white placeholder-slate-600 transition-all" placeholder="Target Amount" />
              </div>
              <input type="date" required value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-white placeholder-slate-600 transition-all [color-scheme:dark]" />
              <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-[0.98]">
                {status || "Start Saving"}
              </button>
            </form>
          </div>
        </div>

        {/* Active Goals */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/30 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/30 h-full">
            <h2 className="text-xl font-bold mb-8 text-white">Your Active Targets</h2>
            <div className="flex flex-col gap-6">
              {goals.map((goal) => {
                const percentage = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
                return (
                  <div key={goal.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 hover:bg-slate-800/40 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-blue-500/5 blur-2xl"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-wide">{goal.name}</h3>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{percentage}%</p>
                        <button onClick={() => handleDelete(goal.id)} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-950/80 rounded-full h-4 mb-4 border border-slate-800/80 relative z-10">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" style={{ width: `${percentage}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm font-bold text-slate-400 relative z-10">
                      <div className="flex items-center gap-2">
                         {/* Quick Add Funds Input */}
                         <input type="number" placeholder="RM Amount" value={fundAmounts[goal.id] || ""} onChange={(e) => setFundAmounts({...fundAmounts, [goal.id]: e.target.value})} className="w-32 p-2 bg-slate-950 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 text-xs" />
                         <button onClick={() => handleAddFunds(goal.id, goal.name, goal.current_amount)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-lg transition-colors text-xs font-bold">Add Funds</button>
                      </div>
                      <span className="text-right">Saved: RM {Number(goal.current_amount).toLocaleString()} / Target: RM {Number(goal.target_amount).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
