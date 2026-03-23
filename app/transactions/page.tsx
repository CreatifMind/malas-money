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
  
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => { fetchTransactions(); }, []);
  
  useEffect(() => {
    calculateChartData(transactions);
  }, [viewMonth, viewYear, transactions]);

  const fetchTransactions = async () => {
    const { data } = await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(200);
    if (data) setTransactions(data);
  };

  const calculateChartData = (data: any[]) => {
    let total = 0;
    const categoryMap: Record<string, number> = {};

    data.forEach(tx => {
      const txDate = new Date(tx.date);
      if (tx.type === 'expense' && txDate.getMonth() === viewMonth && txDate.getFullYear() === viewYear) {
        total += Number(tx.amount);
        categoryMap[tx.category] = (categoryMap[tx.category] || 0) + Number(tx.amount);
      }
    });

    setMonthlyTotal(total);
    
    const colors = ['#eab308', '#4f46e5', '#64748b', '#06b6d4', '#ec4899', '#f97316'];
    const formattedData = Object.keys(categoryMap)
      .sort((a, b) => categoryMap[b] - categoryMap[a])
      .map((key, index) => ({ name: key, value: categoryMap[key], color: colors[index % colors.length] }));
      
    setChartData(formattedData);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } 
    else { setViewMonth(viewMonth - 1); }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } 
    else { setViewMonth(viewMonth + 1); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Processing...");
    const finalCategory = type === "income" ? "General Income" : category;
    const { error } = await supabase.from("transactions").insert([{
      amount: parseFloat(amount), category: finalCategory, type, 
      description: type === "income" ? (isRecurring ? "Recurring Income" : "One-time Income") : description, date,
    }]);

    if (!error) {
      setStatus("Success"); setAmount(""); setCategory(""); setDescription(""); setIsRecurring(false);
      fetchTransactions(); setTimeout(() => setStatus(""), 2000);
    } else setStatus("Error: " + error.message);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchTransactions();
  };

  const getCategoryIcon = (catName: string, color: string) => {
    const name = catName.toLowerCase();
    if (name.includes('saving') || name.includes('goal')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    if (name.includes('invest') || name.includes('portfolio')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    if (name.includes('epf') || name.includes('work') || name.includes('tax')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    if (name.includes('food') || name.includes('dine')) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; 
  };

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  return (
    <div className="min-h-full bg-white dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-xl dark:shadow-2xl text-slate-900 dark:text-slate-50 animate-in fade-in duration-500 pb-20 transition-colors duration-300">
      <header className="mb-6 md:mb-10 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">Transactions</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic text-sm md:text-base transition-colors duration-300">
          {type === 'income' ? 'Logging an inflow of cash...' : 'Logging an outflow of cash...'}
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
        <div className="xl:col-span-5">
          <div className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 relative overflow-hidden transition-all duration-700">
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full mix-blend-screen filter blur-[80px] opacity-10 dark:opacity-20 transition-all duration-700 ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <form onSubmit={handleSubmit} className="relative z-10 flex flex-col">
              <div className="flex p-1.5 bg-white dark:bg-slate-950/50 backdrop-blur-md rounded-2xl mb-8 border border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all duration-300 ${type === 'expense' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                   Expense
                </button>
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold tracking-wide transition-all duration-300 ${type === 'income' ? 'bg-emerald-500 text-white dark:text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                   Income
                </button>
              </div>

              <div className="text-center mb-8">
                <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em] transition-colors duration-300">Amount</p>
                <div className="flex items-center justify-center text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white transition-colors duration-300">
                  <span className={`mr-2 transition-colors duration-500 ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>RM</span>
                  <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none w-full max-w-[200px] text-center focus:ring-0 p-0 placeholder-slate-300 dark:placeholder-slate-800" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-3 md:space-y-4 mb-6">
                {type === 'expense' ? (
                  <>
                    <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm md:text-base" placeholder="Category (e.g., Food)" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl outline-none focus:border-rose-500/50 transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 text-sm md:text-base" placeholder="Note (Optional)" />
                  </>
                ) : (
                  <div className="flex items-center justify-between p-4 md:p-5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 transition-colors duration-300">
                    <span className="text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400">Set as Recurring Monthly Income?</span>
                    <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-10 md:w-12 h-5 md:h-6 rounded-full transition-all relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'}`}>
                      <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-5 md:left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                )}
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={`w-full p-3.5 md:p-4 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl outline-none transition-all text-slate-900 dark:text-white text-sm md:text-base dark:[color-scheme:dark] ${type === 'income' ? 'focus:border-emerald-500/50' : 'focus:border-rose-500/50'}`} />
              </div>

              <button type="submit" className={`w-full font-extrabold py-3.5 md:py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] text-sm md:text-base ${type === 'income' ? 'bg-emerald-500 text-white dark:text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'}`}>
                {status || (type === 'income' ? 'Deposit Funds' : 'Log Expense')}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-7 flex flex-col gap-6 md:gap-8">
          <div className="bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white transition-colors duration-300">Expenses</h2>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-full px-2 py-1 transition-colors duration-300">
                <button onClick={handlePrevMonth} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest w-20 text-center transition-colors duration-300">
                  {viewYear} {monthNames[viewMonth]}
                </span>
                <button onClick={handleNextMonth} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
            
            {chartData.length === 0 ? (
              <p className="text-slate-500 py-10 text-center font-medium">No expenses logged for {monthNames[viewMonth]} {viewYear}.</p>
            ) : (
              <>
                <div className="h-56 md:h-64 w-full relative flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={2} dataKey="value" stroke="none">
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                      </Pie>
                      <Tooltip formatter={(value: any) => `RM ${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '1rem', color: '#f8fafc', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 transition-colors duration-300">Total</span>
                    <span className="text-slate-900 dark:text-white text-xl md:text-2xl font-extrabold tracking-tight transition-colors duration-300">
                      RM {monthlyTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  {chartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-300">
                      <div className="flex items-center gap-4 truncate pr-4">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm dark:shadow-lg border bg-opacity-10 dark:bg-opacity-15" style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }}>
                           {getCategoryIcon(item.name, item.color)}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-bold text-xs md:text-sm truncate transition-colors duration-300" title={item.name}>{item.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-slate-900 dark:text-white font-extrabold text-sm md:text-base transition-colors duration-300">RM {item.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold mt-0.5">{((item.value / monthlyTotal) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/30 flex-1 transition-colors duration-300">
            <h2 className="text-lg md:text-xl font-bold mb-6 text-slate-900 dark:text-white transition-colors duration-300">Recent History</h2>
            <div className="space-y-3">
              {transactions.slice(0, 15).map((tx) => (
                <div key={tx.id} className="p-3 md:p-4 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex justify-between items-center group hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors duration-300 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${tx.type === 'expense' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500'}`}>
                      {tx.type === 'expense' ? '↓' : '↑'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm md:text-base truncate transition-colors duration-300">{tx.category}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 font-medium">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <div className="text-right">
                       <span className={`font-bold tabular-nums text-sm md:text-base ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                        {tx.type === 'expense' ? '- ' : '+ '}RM {tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <button onClick={() => handleDelete(tx.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all">
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
