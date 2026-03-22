"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function EPFTracker() {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [employeeAmount, setEmployeeAmount] = useState("");
  const [employerAmount, setEmployerAmount] = useState("");
  const [status, setStatus] = useState("");

  const [epfLogs, setEpfLogs] = useState<any[]>([]);
  const [totals, setTotals] = useState({ employee: 0, employer: 0, combined: 0 });

  useEffect(() => { fetchEpfData(); }, []);

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
    
    // 1. Log the EPF Vault entry
    const { error } = await supabase.from("epf_logs").insert([{ 
      month, 
      year: parseInt(year), 
      employee_contribution: empAmount, 
      employer_contribution: parseFloat(employerAmount) 
    }]);
    
    if (!error) {
      // 2. The Magic: Auto-Deduct ONLY the employee's portion from liquid cash!
      await supabase.from("transactions").insert([{
        amount: empAmount,
        category: `EPF Deduction`,
        type: "expense",
        description: `${month} ${year} Contribution`,
        date: new Date().toISOString().split('T')[0] // Today's date
      }]);

      setStatus("Success"); 
      setMonth(""); 
      setEmployeeAmount(""); 
      setEmployerAmount("");
      fetchEpfData(); 
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Error: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("epf_logs").delete().eq("id", id);
    if (!error) fetchEpfData();
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[2.5rem] p-8 m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500">
      <header className="mb-10 flex justify-between items-end px-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">EPF Vault</h1>
          <p className="text-slate-400 mt-1 font-medium">Tracking your compound retirement.</p>
        </div>
      </header>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50 shadow-xl group">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-600 rounded-full mix-blend-screen filter blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider relative z-10">Total Accumulated</h3>
          <p className="text-4xl font-extrabold text-white relative z-10">RM {totals.combined.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Your Contribution</h3>
          <p className="text-3xl font-bold text-slate-300">RM {totals.employee.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-800/50">
          <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Company Match</h3>
          <p className="text-3xl font-bold text-slate-300">RM {totals.employer.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* The Form */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50">
            <h2 className="text-xl font-bold mb-8 text-white">Log Deduction</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <select required value={month} onChange={(e) => setMonth(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white appearance-none">
                    <option value="" disabled>Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <input type="number" required value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-slate-600" placeholder="Year" />
              </div>

              <input type="number" step="0.01" required value={employeeAmount} onChange={(e) => setEmployeeAmount(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-slate-600" placeholder="Employee Deduction (RM)" />
              <input type="number" step="0.01" required value={employerAmount} onChange={(e) => setEmployerAmount(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 text-white placeholder-slate-600" placeholder="Company Match (RM)" />

              <button type="submit" className="mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] active:scale-[0.98]">
                {status || "Save Record"}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900/30 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/30 h-full">
            <h2 className="text-xl font-bold mb-8 text-white">Vault History</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="pb-4 font-bold">Period</th>
                    <th className="pb-4 font-bold">Employee</th>
                    <th className="pb-4 font-bold">Employer</th>
                    <th className="pb-4 font-bold text-violet-400">Total Added</th>
                    <th className="pb-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {epfLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-4 pr-4 font-extrabold text-white">{log.month} {log.year}</td>
                      <td className="py-4 text-slate-300 font-medium">RM {Number(log.employee_contribution).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                      <td className="py-4 text-slate-300 font-medium">RM {Number(log.employer_contribution).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                      <td className="py-4 font-extrabold text-violet-400">
                        RM {(Number(log.employee_contribution) + Number(log.employer_contribution)).toLocaleString(undefined, {minimumFractionDigits:2})}
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDelete(log.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
