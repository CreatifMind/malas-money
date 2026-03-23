"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function DeductionsHub() {
  const [activeTab, setActiveTab] = useState("overview");
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // Core Data
  const [baseSalary, setBaseSalary] = useState<string>("0");
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  
  // Insurance State
  const [insurances, setInsurances] = useState<any[]>([]);
  const [insName, setInsName] = useState("");
  const [insType, setInsType] = useState("Life");
  const [insAmount, setInsAmount] = useState("");

  // Tax Reliefs State
  const [reliefs, setReliefs] = useState<Record<string, number>>({
    'Life Insurance': 0,
    'Medical (Self/Family)': 0,
    'SSPN': 0,
    'Lifestyle': 0,
    'Education': 0
  });

  // EPF Dividend State
  const [epfTotal, setEpfTotal] = useState(0);
  const [dividendRate, setDividendRate] = useState("6.15");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);

    // Fetch Profile (Salary)
    const { data: profile } = await supabase.from('profiles').select('base_salary').eq('id', session.user.id).single();
    if (profile) setBaseSalary(profile.base_salary.toString());

    // Fetch Insurances
    const { data: insData } = await supabase.from('insurances').select('*').order('created_at', { ascending: false });
    if (insData) setInsurances(insData);

    // Fetch Tax Reliefs
    const { data: trData } = await supabase.from('tax_reliefs').select('*').eq('year', 2025);
    if (trData && trData.length > 0) {
      const reliefMap: Record<string, number> = { ...reliefs };
      trData.forEach(r => { reliefMap[r.category] = Number(r.amount); });
      setReliefs(reliefMap);
    }

    // Fetch EPF Total for Dividend Calculator
    const { data: epfData } = await supabase.from('epf_logs').select('*');
    if (epfData) {
      let total = 0;
      epfData.forEach(log => { total += Number(log.employee_contribution) + Number(log.employer_contribution); });
      setEpfTotal(total);
    }
  };

  // --- ACTIONS ---
  const handleSaveSalary = async () => {
    if (!userId) return;
    await supabase.from('profiles').update({ base_salary: parseFloat(baseSalary) || 0 }).eq('id', userId);
    setIsEditingSalary(false);
  };

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return; // Safety check to ensure you are logged in

    setStatus("Saving...");
    
    const { error } = await supabase.from('insurances').insert([{ 
      user_id: userId, // <-- THE CRITICAL MISSING PIECE
      name: insName, 
      type: insType, 
      amount: parseFloat(insAmount) 
    }]);

    if (!error) {
      setInsName(""); setInsAmount(""); setStatus("Saved!");
      fetchData(); setTimeout(() => setStatus(""), 2000);
    } else {
      // If anything fails, show the error so it doesn't get stuck forever
      setStatus("Error: " + error.message);
      setTimeout(() => setStatus(""), 4000);
    }
  };

  const handleDeleteInsurance = async (id: string) => {
    await supabase.from('insurances').delete().eq('id', id);
    fetchData();
  };

  const handleSaveReliefs = async () => {
    if (!userId) return;
    setStatus("Saving Reliefs...");
    
    // Clear old 2025 reliefs and insert new ones
    await supabase.from('tax_reliefs').delete().eq('year', 2025);
    
    const inserts = Object.keys(reliefs).map(key => ({
      user_id: userId, category: key, amount: reliefs[key], year: 2025
    }));
    
    await supabase.from('tax_reliefs').insert(inserts);
    setStatus("Reliefs Saved!"); setTimeout(() => setStatus(""), 2000);
  };

  const handleReliefChange = (category: string, value: string) => {
    setReliefs({ ...reliefs, [category]: parseFloat(value) || 0 });
  };

  // --- MATH & CALCULATIONS ---
  const salaryNum = parseFloat(baseSalary) || 0;
  const annualSalary = salaryNum * 12;
  
  // EPF Calc
  const empEPF = salaryNum * 0.11;
  const employerEPF = salaryNum * (salaryNum > 5000 ? 0.12 : 0.13);
  const annualEPF = empEPF * 12;

  // Insurance Calc
  const monthlyInsurance = insurances.reduce((acc, curr) => acc + Number(curr.amount), 0);

  // Tax Calc (LHDN 2024/2025 Rates)
  const baseRelief = 9000;
  const epfReliefClaimable = Math.min(annualEPF, 4000);
  const customReliefsTotal = Object.values(reliefs).reduce((a, b) => a + b, 0);
  const totalReliefs = baseRelief + epfReliefClaimable + customReliefsTotal;
  
  let chargeableIncome = Math.max(annualSalary - totalReliefs, 0);
  let annualTax = 0;

  if (chargeableIncome > 2000000) { annualTax += (chargeableIncome - 2000000) * 0.30; chargeableIncome = 2000000; }
  if (chargeableIncome > 600000) { annualTax += (chargeableIncome - 600000) * 0.28; chargeableIncome = 600000; }
  if (chargeableIncome > 400000) { annualTax += (chargeableIncome - 400000) * 0.25; chargeableIncome = 400000; }
  if (chargeableIncome > 100000) { annualTax += (chargeableIncome - 100000) * 0.24; chargeableIncome = 100000; }
  if (chargeableIncome > 70000) { annualTax += (chargeableIncome - 70000) * 0.21; chargeableIncome = 70000; }
  if (chargeableIncome > 50000) { annualTax += (chargeableIncome - 50000) * 0.14; chargeableIncome = 50000; }
  if (chargeableIncome > 35000) { annualTax += (chargeableIncome - 35000) * 0.08; chargeableIncome = 35000; }
  if (chargeableIncome > 20000) { annualTax += (chargeableIncome - 20000) * 0.03; chargeableIncome = 20000; }
  if (chargeableIncome > 5000) { annualTax += (chargeableIncome - 5000) * 0.01; }

  const monthlyTax = annualTax / 12;
  const netPay = salaryNum - empEPF - monthlyTax - monthlyInsurance;

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500 pb-20">
      
      <header className="mb-6 md:mb-10 px-2 md:px-4 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Deductions</h1>
          <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">Taxes, EPF, and fixed commitments.</p>
        </div>

        {/* Global Salary Input */}
        <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl w-full md:w-auto min-w-[250px]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">Base Monthly Salary</span>
            <button onClick={() => {if (isEditingSalary) handleSaveSalary(); else setIsEditingSalary(true);}} className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors">
              {isEditingSalary ? "Save" : "Edit"}
            </button>
          </div>
          {isEditingSalary ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">RM</span>
              <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="w-full bg-slate-950/80 border border-emerald-500/50 rounded-lg p-2 text-white outline-none focus:border-emerald-400 font-bold" />
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-white">RM {salaryNum.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
          )}
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-2 md:px-4 mb-8">
        {['overview', 'reliefs', 'insurance'].map(tab => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            {tab === 'overview' ? 'Net Pay & EPF' : tab === 'reliefs' ? 'Tax Reliefs (2025)' : 'Insurances'}
          </button>
        ))}
      </div>

      <div className="px-2 md:px-4">
        
        {/* TAB 1: OVERVIEW & EPF */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-4">
            
            {/* The Net Pay Breakdown */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50">
              <h2 className="text-lg font-bold mb-6 text-white">Monthly Breakdown</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                  <span className="text-sm font-bold text-slate-400">Gross Salary</span>
                  <span className="text-base font-extrabold text-white">RM {salaryNum.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-rose-400">EPF Deduction (11%)</span>
                    <span className="text-[10px] text-slate-500 mt-1">+ Employer RM {employerEPF.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                  </div>
                  <span className="text-base font-extrabold text-rose-400">-RM {empEPF.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-rose-400">Est. Tax (PCB)</span>
                    <span className="text-[10px] text-slate-500 mt-1">Based on YA 2025 brackets</span>
                  </div>
                  <span className="text-base font-extrabold text-rose-400">-RM {monthlyTax.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                </div>

                {monthlyInsurance > 0 && (
                  <div className="flex justify-between items-center p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <span className="text-sm font-bold text-amber-400">Fixed Insurances</span>
                    <span className="text-base font-extrabold text-amber-400">-RM {monthlyInsurance.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Est. Net Pay</span>
                <span className="text-3xl font-extrabold text-emerald-400">RM {netPay.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
            </div>

            {/* EPF Dividend Calculator */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden">
               <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-600 rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
              
              <h2 className="text-lg font-bold mb-2 text-white relative z-10">EPF Dividend Forecaster</h2>
              <p className="text-xs text-slate-400 mb-6 relative z-10">Based on your current logged Vault Total.</p>

              <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6 relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-indigo-300">Announced Rate (%)</span>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={dividendRate} onChange={(e) => setDividendRate(e.target.value)} className="w-20 p-2 bg-slate-950/80 border border-indigo-500/50 rounded-lg text-white font-bold text-sm text-right outline-none focus:border-indigo-400" />
                    <span className="text-indigo-400 font-bold">%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-indigo-500/20">
                  <span className="text-sm font-bold text-slate-300">Vault Balance</span>
                  <span className="text-sm font-bold text-white">RM {epfTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                </div>
              </div>

              <div className="text-center mt-8 relative z-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Estimated Annual Dividend</p>
                <p className="text-4xl font-extrabold text-indigo-400">
                  +RM {((epfTotal * (parseFloat(dividendRate) || 0)) / 100).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TAX RELIEFS */}
        {activeTab === 'reliefs' && (
          <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">YA 2025 Relief Checklist</h2>
              <button onClick={handleSaveReliefs} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                {status || "Save Reliefs"}
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mb-8 border-l-2 border-indigo-500 pl-3">
              Individual base relief (RM9,000) and EPF contributions (up to RM4,000) are automatically applied to your Net Pay math. Add your specific claims below.
            </p>

            <div className="space-y-4">
              {Object.keys(reliefs).map((category) => (
                <div key={category} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl gap-3">
                  <div>
                    <p className="font-bold text-white text-sm">{category}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {category === 'Life Insurance' && "Max claim RM3,000"}
                      {category === 'Medical (Self/Family)' && "Max claim RM10,000"}
                      {category === 'SSPN' && "Max claim RM8,000"}
                      {category === 'Lifestyle' && "Max claim RM2,500 (Tech, Sports, etc.)"}
                      {category === 'Education' && "Max claim RM7,000"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-slate-500 font-bold text-sm">RM</span>
                    <input 
                      type="number" value={reliefs[category] || ""} 
                      onChange={(e) => handleReliefChange(category, e.target.value)} 
                      className="w-full sm:w-32 p-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-white font-bold text-sm" 
                      placeholder="0.00" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INSURANCES */}
        {activeTab === 'insurance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-5">
               <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50">
                  <h2 className="text-lg font-bold mb-6 text-white">Add Policy</h2>
                  <form onSubmit={handleAddInsurance} className="flex flex-col gap-4">
                    <input type="text" required value={insName} onChange={(e) => setInsName(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-amber-500/50 text-white text-sm" placeholder="Policy Name (e.g. AIA Medical)" />
                    
                    <div className="relative">
                      <select value={insType} onChange={(e) => setInsType(e.target.value)} className="w-full p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-amber-500/50 text-white appearance-none text-sm cursor-pointer">
                        <option value="Life">Life Insurance</option>
                        <option value="Medical">Medical / Health</option>
                        <option value="Car">Car Insurance</option>
                        <option value="Personal Accident">Personal Accident</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">▼</div>
                    </div>

                    <div className="flex items-center bg-slate-950/50 border border-slate-800/80 rounded-2xl focus-within:border-amber-500/50 transition-colors pl-4">
                      <span className="text-slate-500 font-bold text-sm">RM</span>
                      <input type="number" step="0.01" required value={insAmount} onChange={(e) => setInsAmount(e.target.value)} className="w-full p-4 bg-transparent outline-none text-white text-sm" placeholder="Monthly Premium" />
                    </div>

                    <button type="submit" className="mt-2 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)] active:scale-[0.98] text-sm">
                      {status || "Save Policy"}
                    </button>
                  </form>
               </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/30 h-full">
                <h2 className="text-lg font-bold mb-6 text-white">Active Policies</h2>
                
                <div className="flex flex-col gap-3">
                  {insurances.map((ins) => (
                     <div key={ins.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 transition-colors group">
                       <div>
                         <p className="font-bold text-white text-sm">{ins.name}</p>
                         <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-400 bg-amber-500/10">
                           {ins.type}
                         </span>
                       </div>
                       <div className="flex items-center gap-4">
                         <p className="text-white font-extrabold text-sm">RM {Number(ins.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}/mo</p>
                         <button onClick={() => handleDeleteInsurance(ins.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         </button>
                       </div>
                     </div>
                  ))}
                  {insurances.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No active policies found.</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
