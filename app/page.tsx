"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Onboarding State
  const [startingBalance, setStartingBalance] = useState("");
  
  // Dashboard State
  const [summary, setSummary] = useState({ liquidCash: 0, portfolioValue: 0, epfValue: 0, trueNetWorth: 0 });
  const [baseBalance, setBaseBalance] = useState(0);
  const [expenseChartData, setExpenseChartData] = useState<any[]>([]);
  const [allocationData, setAllocationData] = useState<any[]>([]);

  // New Edit State
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [editCashInput, setEditCashInput] = useState("");

  useEffect(() => { checkUserAndProfile(); }, []);

  const checkUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!profile) { setNeedsOnboarding(true); setLoading(false); } 
      else { setNeedsOnboarding(false); fetchDashboardData(profile.starting_balance); }
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    // NEW: If blank, use 0
    const finalStartingBalance = startingBalance === "" ? 0 : parseFloat(startingBalance);
    const { error } = await supabase.from('profiles').insert([{ id: userId, starting_balance: finalStartingBalance }]);
    if (!error) checkUserAndProfile();
  };

  const fetchDashboardData = async (baseAmount: number) => {
    setBaseBalance(baseAmount);
    const [txRes, epfRes, invRes] = await Promise.all([
      supabase.from("transactions").select("*"),
      supabase.from("epf_logs").select("*"),
      supabase.from("investments").select("*")
    ]);

    let totalIncome = 0; let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    if (txRes.data) {
      txRes.data.forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") {
          totalExpense += Number(tx.amount);
          expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + Number(tx.amount);
        }
      });
    }
    const liquidCash = baseAmount + totalIncome - totalExpense;

    let epfTotal = 0;
    if (epfRes.data) epfRes.data.forEach(log => { epfTotal += (Number(log.employee_contribution) + Number(log.employer_contribution)); });

    let portfolioTotal = 0;
    if (invRes.data) invRes.data.forEach(inv => { portfolioTotal += (Number(inv.quantity) * Number(inv.current_price)); });

    const trueNetWorth = liquidCash + portfolioTotal + epfTotal;

    setSummary({ liquidCash, portfolioValue: portfolioTotal, epfValue: epfTotal, trueNetWorth });
    setExpenseChartData(Object.keys(expenseByCategory).map(key => ({ name: key, total: expenseByCategory[key] })));
    setAllocationData([
      { name: 'Liquid Cash', value: liquidCash > 0 ? liquidCash : 0, color: '#10b981' }, 
      { name: 'Investments', value: portfolioTotal, color: '#0ea5e9' }, 
      { name: 'EPF', value: epfTotal, color: '#8b5cf6' } 
    ].filter(item => item.value > 0)); 
    setLoading(false);
  };

  const handleUpdateCash = async () => {
    if (!userId) return;
    // NEW: If blank, assume 0
    const newTargetCash = editCashInput === "" ? 0 : parseFloat(editCashInput);
    
    const difference = newTargetCash - summary.liquidCash;
    const newStartingBaseline = baseBalance + difference;

    await supabase.from('profiles').update({ starting_balance: newStartingBaseline }).eq('id', userId);
    setIsEditingCash(false);
    checkUserAndProfile();
  };

  if (loading) return <div className="min-h-full flex items-center justify-center text-slate-500 font-medium tracking-wide">Syncing market data...</div>;

  if (needsOnboarding) {
    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 bg-[#0B0F19] rounded-[2.5rem] m-4 shadow-2xl">
          <div className="bg-slate-900/50 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-2xl border border-slate-800/50 max-w-lg w-full">
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Welcome.</h1>
            <p className="text-slate-400 mb-10 leading-relaxed text-lg">Let's establish your baseline. How much liquid cash do you currently have?</p>
            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-6">
              <div>
                <input type="number" step="0.01" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} className="w-full p-5 text-2xl font-bold text-white bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-700" placeholder="RM 0.00" />
                <p className="text-sm font-medium text-emerald-400/80 mt-3 px-2 italic">Leave blank if you're starting from RM 0. You can edit this later.</p>
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-[0.98] text-lg">Enter Dashboard</button>
            </form>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-[#0B0F19] rounded-[2.5rem] p-8 m-4 shadow-2xl text-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 overflow-hidden relative">
      <header className="mb-10 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Overview</h1>
          <p className="text-slate-400 mt-1 font-medium italic">Because your wallet deserves effort… even if you don’t.</p>
        </div>
      </header>

      {/* Hero Metric: True Net Worth */}
      <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 text-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] mb-10 group cursor-default">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <h3 className="text-slate-400 text-sm font-bold mb-2 uppercase tracking-[0.2em]">True Net Worth</h3>
          <p className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            RM {summary.trueNetWorth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </p>
        </div>
      </div>

      {/* Glassmorphism Sub Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
        
        {/* LIQUID CASH CARD */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 hover:bg-slate-800/40 transition-colors relative">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div></div>
            <button onClick={() => { setIsEditingCash(!isEditingCash); setEditCashInput(summary.liquidCash.toString()); }} className="p-2 text-slate-500 hover:text-emerald-400 transition-colors rounded-xl hover:bg-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
          </div>
          
          <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wide">Liquid Cash</h3>
          
          {isEditingCash ? (
            <div className="flex items-center gap-2 mt-2 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-slate-400 font-bold">RM</span>
              <input 
                type="number" step="0.01" 
                value={editCashInput} onChange={(e) => setEditCashInput(e.target.value)} 
                className="w-full bg-slate-950/80 border border-emerald-500/50 rounded-xl p-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 font-bold" 
                placeholder="0.00"
              />
              <button onClick={handleUpdateCash} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-extrabold text-sm transition-colors">Save</button>
            </div>
          ) : (
            <p className="text-3xl font-extrabold text-white">RM {summary.liquidCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          )}
        </div>
        
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 hover:bg-slate-800/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-6 border border-sky-500/20"><div className="w-3 h-3 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div></div>
          <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wide">Portfolio</h3>
          <p className="text-3xl font-extrabold text-white">RM {summary.portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 hover:bg-slate-800/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-500/20"><div className="w-3 h-3 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div></div>
          <h3 className="text-sm font-bold text-slate-500 mb-1 tracking-wide">Retirement (EPF)</h3>
          <p className="text-3xl font-extrabold text-white">RM {summary.epfValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
          <h2 className="text-lg font-bold mb-8 text-white">Asset Allocation</h2>
          {allocationData.length === 0 ? (
             <p className="text-slate-500 py-10 text-center font-medium">Add funds to see your allocation.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={6} dataKey="value" stroke="none">
                    {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => typeof value === 'number' ? `RM ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}` : 'RM 0.00'} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f8fafc', fontWeight: 'bold' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
          <h2 className="text-lg font-bold mb-8 text-white">Cash Flow</h2>
          {expenseChartData.length === 0 ? (
            <p className="text-slate-500 py-10 text-center font-medium">No expenses logged yet.</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `RM ${value}`} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b', opacity: 0.5, rx: 10 }} 
                    formatter={(value: any) => typeof value === 'number' ? `RM ${value.toFixed(2)}` : 'RM 0.00'} 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f8fafc', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="total" fill="#10b981" radius={[8, 8, 8, 8]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
