"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function Transactions() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [status, setStatus] = useState("");
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    // Fetching more records to ensure the monthly chart is accurate
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(100);
    if (data) {
      setTransactions(data);
      
      // Calculate data for the Maybank-style Chart (Current Month Expenses)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let total = 0;
      const categoryMap: Record<string, number> = {};

      data.forEach(tx => {
        const txDate = new Date(tx.date);
        if (tx.type === 'expense' && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
          total += Number(tx.amount);
          categoryMap[tx.category] = (categoryMap[tx.category] || 0) + Number(tx.amount);
        }
      });

      setMonthlyTotal(total);
      
      // Define a premium color palette for the chart
      const colors = ['#eab308', '#4f46e5', '#64748b', '#06b6d4', '#ec4899', '#f97316'];
      const formattedData = Object.keys(categoryMap)
        .sort((a, b) => categoryMap[b] - categoryMap[a]) // Sort largest first
        .map((key, index) => ({
          name: key,
          value: categoryMap[key],
          color: colors[index % colors.length]
        }));
        
      setChartData(formattedData);
    }
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
    if (!error) fetchTransactions();
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500 pb-20">
      <header className="mb-6 md:mb-10 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Transactions</h1>
        <p className="text-slate-400 mt-1 font-medium italic text-sm md:text-base">
          {type === 'income' ? 'Logging an inflow of cash...' : 'Logging an outflow of cash...'}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
        
        {/* Left Column: The Interactive Log Form */}
        <div className="xl:col-span-5">
          <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden transition-all duration-700">
            {/* DYNAMIC AMBIENT GLOW */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-20 transition-all duration-700 ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col">
              {/* Type Switcher */}
              <div className="flex p-1.5 bg-slate-950/50 backdrop-blur-md rounded-2xl mb-8 border border-slate-800/50">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all duration-300 ${type === 'expense' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
                   Expense
                </button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all duration-300 ${type === 'income' ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>
                   Income
                </button>
              </div>

              {/* Amount Input */}
              <div className="text-center mb-8">
                <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 uppercase tracking-[0.2em]">Amount</p>
                <div className="flex items-center justify-center text-5xl md:text-6xl font-extrabold text-white">
                  <span className={`mr-2 transition-colors duration-500 ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>RM</span>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none w-full max-w-[200px] text-center focus:ring-0 p-0 placeholder-slate-800" placeholder="0.00" />
                </div>
              </div>

              {/* Dynamic Inputs */}
              <div className="space-y-3 md:space-y-4 mb-6">
                {type === 'expense' ? (
                  <>
                    <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-white placeholder-slate-600 text-sm md:text-base" placeholder="Category (e.g., Food)" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-white placeholder-slate-600 text-sm md:text-base" placeholder="Note (Optional)" />
                  </>
                ) : (
                  <div className="flex items-center justify-between p-4 md:p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <span className="text-xs md:text-sm font-bold text-emerald-400">Set as Recurring Monthly Income?</span>
                    <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-10 md:w-12 h-5 md:h-6 rounded-full transition-all relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-5 md:left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                )}
                
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none transition-all text-white text-sm md:text-base [color-scheme:dark] ${type === 'income' ? 'focus:border-emerald-500/50' : 'focus:border-rose-500/50'}`} />
              </div>

              {/* DYNAMIC ACTION BUTTON */}
              <button type="submit" className={`w-full font-extrabold py-3.5 md:py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] text-sm md:text-base ${type === 'income' ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'}`}>
                {status || (type === 'income' ? 'Deposit Funds' : 'Log Expense')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Chart & History */}
        <div className="xl:col-span-7 flex flex-col gap-6 md:gap-8">
          
          {/* MAYBANK MAE STYLE EXPENSE CHART */}
          <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Expenses</h2>
              <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
            </div>
            
            {chartData.length === 0 ? (
              <p className="text-slate-400 py-10 text-center font-medium">No expenses logged this month.</p>
            ) : (
              <>
                <div className="h-56 md:h-64 w-full relative flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => `RM ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-500 text-xs font-medium">This month's</span>
                    <span className="text-slate-500 text-xs font-medium mb-1">spending</span>
                    <span className="text-slate-900 text-xl md:text-2xl font-extrabold tracking-tight">
                      RM {monthlyTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                {/* Categories Breakdown */}
                <div className="mt-6 overflow-x-auto pb-4 hide-scrollbar">
                  <div className="flex gap-4 min-w-max">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: `${item.color}15` }}>
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-bold text-slate-900 w-20 truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-rose-500">-RM {item.value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile-Optimized History Feed */}
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/30 flex-1">
            <h2 className="text-lg md:text-xl font-bold mb-6 text-white">Recent History</h2>
            <div className="space-y-3">
              {transactions.slice(0, 15).map((tx) => (
                <div key={tx.id} className="p-3 md:p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl flex justify-between items-center group hover:bg-slate-900/60 transition-all">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${tx.type === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {tx.type === 'expense' ? '↓' : '↑'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm md:text-base truncate">{tx.category}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <div className="text-right">
                       <span className={`font-bold tabular-nums text-sm md:text-base ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.type === 'expense' ? '- ' : '+ '}RM {tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <button onClick={() => handleDelete(tx.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
