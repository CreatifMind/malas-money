"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function EPFVault() {
  const [employeeContribution, setEmployeeContribution] = useState("");
  const [employerContribution, setEmployerContribution] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState("");
  
  const [epfLogs, setEpfLogs] = useState<any[]>([]);
  const [totalEpf, setTotalEpf] = useState(0);
  
  // The "Brain Upgrade" State
  const [baseSalary, setBaseSalary] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { 
    fetchEPFData(); 
  }, []);

  const fetchEPFData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    // Fetch the salary they saved on the Deductions page
    const { data: profile } = await supabase.from('profiles').select('base_salary').eq('id', session.user.id).single();
    if (profile && profile.base_salary) setBaseSalary(profile.base_salary);

    const { data } = await supabase.from("epf_logs").select("*").order("created_at", { ascending: false });
    if (data) {
      setEpfLogs(data);
      let total = 0;
      data.forEach(log => { total += (Number(log.employee_contribution) + Number(log.employer_contribution)); });
      setTotalEpf(total);
    }
  };

  const handleStandardLog = async () => {
    if (baseSalary === 0 || !userId) return;
    setStatus("Logging Standard Month...");
    
    const empEPF = baseSalary * 0.11;
    const employerEPF = baseSalary * (baseSalary > 5000 ? 0.12 : 0.13);
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const { error } = await supabase.from("epf_logs").insert([{
      employee_contribution: empEPF, employer_contribution: employerEPF, month: currentMonth, year: currentYear
    }]);

    if (!error) {
      setStatus("Saved!"); fetchEPFData(); setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Error: " + error.message);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Saving custom log...");
    const { error } = await supabase.from("epf_logs").insert([{
      employee_contribution: parseFloat(employeeContribution), employer_contribution: parseFloat(employerContribution), month, year: parseInt(year)
    }]);
    if (!error) {
      setStatus("Success"); setEmployeeContribution(""); setEmployerContribution(""); setMonth("");
      fetchEPFData(); setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Error: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("epf_logs").delete().eq("id", id);
    fetchEPFData();
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-xl dark:shadow-2xl text-slate-900 dark:text-slate-50 animate-in fade-in duration-500 pb-20 transition-colors duration-300">
      
      <header className="mb-6 md:mb-10 px-2 md:px-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">EPF Vault</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-base transition-colors duration-300">Track your retirement compounding.</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 px-4 py-3 rounded-2xl text-right animate-in zoom-in-95 transition-colors duration-300">
          <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-0.5">Total Vault</p>
          <p className="text-xl md:text-2xl font-extrabold text-violet-500 dark:text-violet-300 transition-colors duration-300">RM {totalEpf.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* THE BRAIN UPGRADE: Fast Log */}
          {baseSalary > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-indigo-200 dark:border-indigo-500/30 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full mix-blend-screen filter blur-[50px] opacity-10 dark:opacity-20 transition-opacity"></div>
              <h2 className="text-lg font-bold mb-2 text-indigo-900 dark:text-indigo-100 transition-colors duration-300 relative z-10">Fast Log (Standard Month)</h2>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-6 relative z-10">Based on your saved RM {baseSalary.toLocaleString()} salary.</p>
              
              <button onClick={handleStandardLog} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] text-sm md:text-base relative z-10">
                {status && status.includes('Standard') ? status : `Log RM ${((baseSalary * 0.11) + (baseSalary * (baseSalary > 5000 ? 0.12 : 0.13))).toLocaleString(undefined, {minimumFractionDigits:2})}`}
              </button>
            </div>
          )}

          {/* Manual Log for Bonuses/Voluntary */}
          <div className="bg-slate-50 dark:bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
            <h2 className="text-lg font-bold mb-6 text-slate-900 dark:text-white transition-colors duration-300">Custom Log</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Use this for bonuses or voluntary i-Simpan top-ups.</p>
            
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4 md:gap-5">
              <div className="flex gap-4">
                <input type="text" required value={month} onChange={(e) => setMonth(e.target.value)} className="w-full p-3.5 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-violet-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 text-sm" placeholder="Month (e.g., Dec)" />
                <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-3.5 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-violet-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 text-sm" placeholder="Year" />
              </div>
              
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm">RM</div>
                 <input type="number" step="0.01" required value={employeeContribution} onChange={(e) => setEmployeeContribution(e.target.value)} className="w-full pl-12 p-3.5 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-violet-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 text-sm" placeholder="Employee Cut (You)" />
              </div>

              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 font-bold text-sm">RM</div>
                 <input type="number" step="0.01" required value={employerContribution} onChange={(e) => setEmployerContribution(e.target.value)} className="w-full pl-12 p-3.5 bg-white dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800/80 rounded-2xl outline-none focus:border-violet-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 transition-colors duration-300 text-sm" placeholder="Employer Match (Them)" />
              </div>

              <button type="submit" className="mt-2 w-full bg-slate-800 hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg active:scale-[0.98] text-sm">
                {(status && !status.includes('Standard')) ? status : "Log Custom Amount"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-slate-50 dark:bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800/30 h-full transition-colors duration-300">
            <h2 className="text-lg md:text-xl font-bold mb-6 text-slate-900 dark:text-white transition-colors duration-300">Contribution History</h2>
            
            <div className="flex flex-col gap-3">
              {epfLogs.map((log) => {
                const rowTotal = Number(log.employee_contribution) + Number(log.employer_contribution);
                return (
                 <div key={log.id} className="p-4 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center group hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors duration-300 shadow-sm dark:shadow-none gap-4">
                   <div className="flex items-center justify-between md:justify-start gap-4">
                     <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase text-center leading-tight border border-violet-200 dark:border-violet-500/20">
                       {log.month.substring(0,3)}<br/>{log.year}
                     </div>
                     <div>
                       <p className="font-bold text-slate-900 dark:text-white text-base transition-colors duration-300">+ RM {rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                       <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                         You: {Number(log.employee_contribution).toLocaleString(undefined, {maximumFractionDigits: 0})} | Employer: {Number(log.employer_contribution).toLocaleString(undefined, {maximumFractionDigits: 0})}
                       </p>
                     </div>
                   </div>
                   <button onClick={() => handleDelete(log.id)} className="self-end md:self-auto opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                   </button>
                 </div>
                );
              })}
              {epfLogs.length === 0 && (
                <p className="text-center text-slate-500 py-8 font-medium">No EPF contributions logged yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
