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
  
  const [baseSalary, setBaseSalary] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [autoSyncMessage, setAutoSyncMessage] = useState("");
  const [isRefreshingSync, setIsRefreshingSync] = useState(false);

  useEffect(() => { 
    fetchEPFData(); 
  }, []);

  const fetchEPFData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    const { data: profile } = await supabase.from('profiles').select('base_salary').eq('id', session.user.id).single();
    const currentSalary = profile?.base_salary || 0;
    setBaseSalary(currentSalary);

    const { data } = await supabase.from("epf_logs").select("*").order("created_at", { ascending: false });
    
    if (data) {
      let currentLogs = [...data];

      if (currentSalary > 0) {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        const hasCurrentMonth = currentLogs.some(log => log.month === currentMonth && log.year === currentYear);

        if (!hasCurrentMonth) {
          const empEPF = currentSalary * 0.11;
          const employerEPF = currentSalary * (currentSalary > 5000 ? 0.12 : 0.13);

          const { data: newLog, error: insertError } = await supabase.from("epf_logs").insert([{
            employee_contribution: empEPF, 
            employer_contribution: employerEPF, 
            month: currentMonth, 
            year: currentYear
          }]).select().single(); 

          if (!insertError && newLog) {
            currentLogs = [newLog, ...currentLogs];
            setAutoSyncMessage(`Auto-synced RM ${((empEPF) + (employerEPF)).toLocaleString(undefined, {minimumFractionDigits:2})} for ${currentMonth}`);
            setTimeout(() => setAutoSyncMessage(""), 6000); 
          }
        }
      }

      setEpfLogs(currentLogs);
      
      let total = 0;
      currentLogs.forEach(log => { total += (Number(log.employee_contribution) + Number(log.employer_contribution)); });
      setTotalEpf(total);
    }
  };

  // NEW: The Manual Recalculate Logic
  const handleRefreshSync = async () => {
    if (baseSalary === 0 || !userId) return;
    setIsRefreshingSync(true);

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const empEPF = baseSalary * 0.11;
    const employerEPF = baseSalary * (baseSalary > 5000 ? 0.12 : 0.13);

    // Find the current month's log to update it
    const existingLog = epfLogs.find(log => log.month === currentMonth && log.year === currentYear);

    if (existingLog) {
      const { error } = await supabase.from("epf_logs")
        .update({ employee_contribution: empEPF, employer_contribution: employerEPF })
        .eq('id', existingLog.id);
      
      if (!error) {
         setAutoSyncMessage(`Recalculated: RM ${((empEPF) + (employerEPF)).toLocaleString(undefined, {minimumFractionDigits:2})} for ${currentMonth}`);
         fetchEPFData();
      }
    } else {
      // Just in case they deleted it and hit refresh
      const { error } = await supabase.from("epf_logs").insert([{
          employee_contribution: empEPF, employer_contribution: employerEPF, month: currentMonth, year: currentYear
      }]);
      if (!error) {
         setAutoSyncMessage(`Synced RM ${((empEPF) + (employerEPF)).toLocaleString(undefined, {minimumFractionDigits:2})} for ${currentMonth}`);
         fetchEPFData();
      }
    }
    
    setIsRefreshingSync(false);
    setTimeout(() => setAutoSyncMessage(""), 6000);
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
          
          {/* Smart Auto-Sync Status Card WITH REFRESH BUTTON */}
          {baseSalary > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-emerald-200 dark:border-emerald-500/30 transition-colors duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full mix-blend-screen filter blur-[50px] opacity-10 dark:opacity-20 transition-opacity"></div>
              
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                   <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 transition-colors duration-300">Smart Auto-Sync Active</h2>
                </div>
                
                {/* REFRESH BUTTON */}
                <button 
                  onClick={handleRefreshSync} 
                  disabled={isRefreshingSync}
                  className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                  title="Recalculate current month based on latest salary"
                >
                  <svg className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshingSync ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
                </button>
              </div>
              
              <p className="text-xs text-emerald-700 dark:text-emerald-300 relative z-10 leading-relaxed">
                Your standard deductions (based on RM {baseSalary.toLocaleString()}) are automatically logged into your vault. Changed your salary? Hit refresh to recalculate.
              </p>

              {autoSyncMessage && (
                 <div className="mt-5 p-3.5 bg-white dark:bg-emerald-500/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300 shadow-sm dark:shadow-none">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   {autoSyncMessage}
                 </div>
              )}
            </div>
          )}

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
                {status || "Log Custom Amount"}
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
