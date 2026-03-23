"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [startingBalance, setStartingBalance] = useState("");
  const [summary, setSummary] = useState({ liquidCash: 0, portfolioValue: 0, epfValue: 0, trueNetWorth: 0 });
  const [baseBalance, setBaseBalance] = useState(0);
  const [allocationData, setAllocationData] = useState<any[]>([]);
  
  const [isNetWorthVisible, setIsNetWorthVisible] = useState(true);

  useEffect(() => { checkUserAndProfile(); }, []);

  const checkUserAndProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      
      if (!profile) {
        setNeedsOnboarding(true);
        setLoading(false);
      } else {
        fetchDashboardData(profile.starting_balance);
      }
    } else {
      setUserId(null); 
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const finalStartingBalance = startingBalance === "" ? 0 : parseFloat(startingBalance);
    const { error } = await supabase.from('profiles').insert([{ id: userId, starting_balance: finalStartingBalance }]);
    if (!error) checkUserAndProfile();
  };

  const fetchDashboardData = async (baseAmount: number) => {
    setBaseBalance(baseAmount);
    try {
      const [txRes, epfRes, invRes] = await Promise.all([
        supabase.from("transactions").select("*"),
        supabase.from("epf_logs").select("*"),
        supabase.from("investments").select("*")
      ]);

      if (txRes.error || epfRes.error || invRes.error) return;

      let totalIncome = 0; let totalExpense = 0;
      if (txRes.data) {
        txRes.data.forEach((tx) => {
          if (tx.type === "income") totalIncome += Number(tx.amount);
          if (tx.type === "expense") totalExpense += Number(tx.amount);
        });
      }
      
      const liquidCash = baseAmount + totalIncome - totalExpense;

      let epfTotal = 0;
      if (epfRes.data) epfRes.data.forEach(log => { epfTotal += (Number(log.employee_contribution) + Number(log.employer_contribution)); });

      let portfolioTotal = 0;
      if (invRes.data) invRes.data.forEach(inv => { portfolioTotal += (Number(inv.quantity) * Number(inv.current_price)); });

      const trueNetWorth = liquidCash + portfolioTotal + epfTotal;

      setSummary({ liquidCash, portfolioValue: portfolioTotal, epfValue: epfTotal, trueNetWorth });
      setAllocationData([
        { name: 'Liquid Cash', value: liquidCash > 0 ? liquidCash : 0, color: '#10b981' }, 
        { name: 'Investments', value: portfolioTotal, color: '#0ea5e9' }, 
        { name: 'EPF', value: epfTotal, color: '#8b5cf6' } 
      ].filter(item => item.value > 0)); 

    } catch (error) {
      console.error("Dashboard Fetch Error", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-full flex items-center justify-center text-slate-500 font-medium tracking-wide">Syncing market data...</div>;

  if (needsOnboarding) {
    return (
        <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-8 bg-slate-50 dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] m-2 md:m-4 shadow-xl dark:shadow-2xl transition-colors duration-300">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800/50 max-w-lg w-full transition-colors duration-300">
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Welcome.</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed text-lg">Let's establish your baseline. How much liquid cash do you currently have?</p>
            <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-6">
              <div>
                <input type="number" step="0.01" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} className="w-full p-5 text-2xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-slate-400 dark:placeholder-slate-700" placeholder="RM 0.00" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold py-5 rounded-2xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-emerald-500/20">Enter Dashboard</button>
            </form>
          </div>
        </div>
      );
  }

  if (!userId) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#0B0F19] m-4 rounded-[2.5rem] transition-colors duration-300">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Session Timed Out</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Please sign in to access your financial data.</p>
        <button onClick={async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = "/"; }} className="bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 px-8 py-3 rounded-2xl font-extrabold transition-all active:scale-95">
          Force Logout & Login
        </button>
      </div>
    );
  }

  const totalAllocated = allocationData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-white dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-xl dark:shadow-2xl text-slate-900 dark:text-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 overflow-hidden relative transition-colors duration-300">
      <header className="mb-10 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic leading-tight transition-colors duration-300">"Because your wallet deserves effort… even if you don’t."</p>
        </div>
      </header>

      {/* Hero Metric: True Net Worth with TNG Privacy Toggle */}
      <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 text-slate-900 dark:text-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] shadow-sm dark:shadow-2xl mb-10 group cursor-default transition-colors duration-300">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-700"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-[0.2em]">True Net Worth</h3>
          
          <div className="flex items-center justify-center gap-3 md:gap-4 mt-2">
            <p className="text-4xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 transition-all duration-300">
              {isNetWorthVisible ? `RM ${summary.trueNetWorth.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'RM ****'}
            </p>
            <button 
              onClick={() => setIsNetWorthVisible(!isNetWorthVisible)} 
              className="p-2 md:p-3 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-800/50"
            >
              {isNetWorthVisible ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10 relative z-10">
        <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 transition-colors duration-300"><div className="w-2 md:w-3 h-2 md:h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div></div>
          </div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 tracking-wide uppercase">Liquid Cash</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
            {isNetWorthVisible ? `RM ${summary.liquidCash.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'RM ****'}
          </p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center mb-6 border border-sky-200 dark:border-sky-500/20 transition-colors duration-300"><div className="w-2 md:w-3 h-2 md:h-3 bg-sky-500 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 tracking-wide uppercase">Portfolio</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
             {isNetWorthVisible ? `RM ${summary.portfolioValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'RM ****'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mb-6 border border-violet-200 dark:border-violet-500/20 transition-colors duration-300"><div className="w-2 md:w-3 h-2 md:h-3 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 tracking-wide uppercase">Retirement (EPF)</h3>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
             {isNetWorthVisible ? `RM ${summary.epfValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'RM ****'}
          </p>
        </div>
      </div>

      <div className="w-full relative z-10">
        <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800/50 max-w-3xl mx-auto transition-colors duration-300">
          <h2 className="text-xl font-extrabold mb-8 text-slate-900 dark:text-white text-center tracking-tight transition-colors duration-300">Asset Allocation</h2>
          
          {allocationData.length === 0 ? (
             <p className="text-slate-500 py-10 text-center font-medium">Add funds to see your allocation.</p>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="h-64 w-64 md:h-72 md:w-72 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                      {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => `RM ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f8fafc', fontWeight: 'bold' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Assets</span>
                  <span className="text-slate-900 dark:text-white text-xl font-extrabold mt-1 transition-colors duration-300">
                     {isNetWorthVisible ? `RM ${totalAllocated >= 1000000 ? (totalAllocated / 1000000).toFixed(2) + 'M' : totalAllocated >= 1000 ? (totalAllocated / 1000).toFixed(1) + 'k' : totalAllocated.toFixed(0)}` : '****'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-xs">
                {allocationData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/50 shadow-sm dark:shadow-none transition-colors duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors duration-300">{item.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-900 dark:text-white font-bold text-sm transition-colors duration-300">
                         {isNetWorthVisible ? `RM ${item.value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : '****'}
                      </span>
                      <span className="text-slate-500 text-xs font-bold">{((item.value / totalAllocated) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
