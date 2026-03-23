"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function EPFTracker() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const [month, setMonth] = useState("");
  const [year, setYear] = useState(currentYear.toString());
  const [employeeAmount, setEmployeeAmount] = useState("");
  const [status, setStatus] = useState("");
  
  // NEW EPF UI States
  const [hasEmployer, setHasEmployer] = useState(true);
  const [salary, setSalary] = useState("");
  const [employerAmount, setEmployerAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  
  // NEW: Dynamic Percentage States
  const [matchPercentage, setMatchPercentage] = useState<number | string>(12);
  const [isEditingMatch, setIsEditingMatch] = useState(false);

  const [epfLogs, setEpfLogs] = useState<any[]>([]);
  const [totals, setTotals] = useState({ employee: 0, employer: 0, combined: 0 });

  useEffect(() => { fetchEpfData(); }, []);

  // UPDATED: Auto-calculate company match based on dynamic percentage
  useEffect(() => {
    if (hasEmployer && salary) {
      const percentage = typeof matchPercentage === 'number' ? matchPercentage : parseFloat(matchPercentage) || 0;
      setEmployerAmount((parseFloat(salary) * (percentage / 100)).toFixed(2));
    } else if (!hasEmployer) {
      setEmployerAmount("0");
    }
  }, [salary, hasEmployer, matchPercentage]);

  const fetchEpfData = async () => {
    const { data } = await supabase.from("epf_logs").select("*").order("year", { ascending: false }).order("month", { ascending: false });
    if (data) {
      setEpfLogs(data);
      let empTotal = 0; let emplyrTotal = 0;
      data.forEach(log => { empTotal += Number(log.employee_contribution); emplyrTotal += Number(log.employer_contribution); });
      setTotals({ employee: empTotal, employer: emplyrTotal, combined: empTotal + emplyrTotal });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Processing...");
    const empAmount = parseFloat(employeeAmount);
    const emplyrAmount = hasEmployer ? parseFloat(employerAmount) : 0;
    
    const { error } = await supabase.from("epf_logs").insert([{ 
      month, year: parseInt(year), employee_contribution: empAmount, employer_contribution: emplyrAmount 
    }]);
    
    if (!error) {
      await supabase.from("transactions").insert([{
        amount: empAmount, category: `EPF Deduction`, type: "expense", 
        description: `${month} ${year} Contribution ${isRecurring ? '(Recurring)' : ''}`,
        date: new Date().toISOString().split('T')[0]
      }]);

      setStatus("Success"); setMonth(""); setEmployeeAmount(""); setSalary(""); 
      fetchEpfData(); setTimeout(() => setStatus(""), 2000);
    } else setStatus("Error: " + error.message);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("epf_logs").delete().eq("id", id);
    if (!error) fetchEpfData();
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500 pb-20">
      <header className="mb-6 md:mb-10 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">EPF Vault</h1>
        <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">Tracking your compound retirement.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50 shadow-xl group">
          <div className="absolute -bottom-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-violet-600 rounded-full mix-blend-screen filter blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider relative z-10">Total Accumulated</h3>
          <p className="text-3xl md:text-4xl font-extrabold text-white relative z-10">RM {totals.combined.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50">
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider">Your Contribution</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-300">RM {totals.employee.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50">
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider">Company Match</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-300">RM {totals.employer.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5">
          <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-white">Log Deduction</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="relative">
                  <select required value={month} onChange={(e) => setMonth(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white appearance-none text-sm md:text-base">
                    <option value="" disabled>Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="relative">
                   <select required value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white appearance-none text-sm md:text-base">
                     {years.map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                </div>
              </div>

              <input type="number" step="0.01" required value={employeeAmount} onChange={(e) => setEmployeeAmount(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-slate-600 text-sm md:text-base" placeholder="Your Deduction (RM)" />
              
              <div className="flex items-center justify-between p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                <span className="text-sm font-bold text-violet-400">Employer Contribution?</span>
                <button type="button" onClick={() => setHasEmployer(!hasEmployer)} className={`w-12 h-6 rounded-full transition-all relative ${hasEmployer ? 'bg-violet-500' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasEmployer ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {hasEmployer && (
                <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/20 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-violet-400">Base Salary (Auto-calculates {matchPercentage}% match)</label>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingMatch(!isEditingMatch)}
                      className="text-[10px] md:text-xs font-bold text-violet-300 bg-violet-500/20 hover:bg-violet-500/40 px-2 py-1 rounded-md transition-colors"
                    >
                      {isEditingMatch ? "Done" : "Edit %"}
                    </button>
                  </div>

                  {isEditingMatch && (
                    <div className="mb-3 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={matchPercentage} 
                        onChange={(e) => setMatchPercentage(e.target.value)} 
                        className="w-20 p-2 text-sm font-bold text-white bg-slate-950/80 border border-violet-500/50 rounded-lg outline-none focus:border-violet-400" 
                        placeholder="%" 
                      />
                      <span className="text-xs font-medium text-slate-400">% Employer Match</span>
                    </div>
                  )}

                  <input type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-3 text-lg font-bold text-white bg-slate-950/80 border border-violet-500/30 rounded-xl outline-none focus:border-violet-400 placeholder-slate-700" placeholder="RM Salary" />
                  <div className="mt-3 flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold">Company Match:</span>
                    <span className="text-violet-400 font-extrabold">RM {employerAmount || "0.00"}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                <span className="text-sm font-bold text-slate-400">Recurring Monthly?</span>
                <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={`w-12 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <button type="submit" className="mt-2 md:mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold py-3.5 md:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] active:scale-[0.98] text-sm md:text-base">
                {status || "Save Record"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/30 h-full">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-white">Vault History</h2>
            <div className="flex flex-col gap-4">
              {epfLogs.map((log) => {
                const totalAdded = Number(log.employee_contribution) + Number(log.employer_contribution);
                return (
                  <div key={log.id} className="bg-slate-950/40 border border-slate-800/50 p-4 md:p-5 rounded-2xl hover:bg-slate-900/60 transition-colors relative group">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-extrabold text-white text-base md:text-lg">{log.month} {log.year}</p>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-violet-400 text-base md:text-lg">
                          +RM {totalAdded.toLocaleString(undefined, {minimumFractionDigits:2})}
                        </span>
                        <button onClick={() => handleDelete(log.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
                      <div>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Your Deduction</p>
                        <p className="text-xs md:text-sm text-slate-300 font-medium">RM {Number(log.employee_contribution).toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Company Match</p>
                         <p className="text-xs md:text-sm text-slate-300 font-medium">RM {Number(log.employer_contribution).toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                      </div>
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
