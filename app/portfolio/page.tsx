"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function Portfolio() {
  const [assetName, setAssetName] = useState("");
  const [ticker, setTicker] = useState("");
  const [assetClass, setAssetClass] = useState("Stock");
  const [totalInvestedInput, setTotalInvestedInput] = useState("");
  const [status, setStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [investments, setInvestments] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalInvested: 0, currentValue: 0, totalProfit: 0 });
  
  // NEW: Liquid Cash State
  const [liquidCash, setLiquidCash] = useState(0);

  useEffect(() => { 
    fetchPortfolioData(); 
    fetchLiquidCash();
  }, []);

  const fetchLiquidCash = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const [profileRes, txRes] = await Promise.all([
      supabase.from('profiles').select('starting_balance').eq('id', session.user.id).single(),
      supabase.from('transactions').select('*')
    ]);

    const baseAmount = profileRes.data?.starting_balance || 0;
    let totalIncome = 0; let totalExpense = 0;
    
    if (txRes.data) {
      txRes.data.forEach((tx) => {
        if (tx.type === "income") totalIncome += Number(tx.amount);
        if (tx.type === "expense") totalExpense += Number(tx.amount);
      });
    }
    setLiquidCash(baseAmount + totalIncome - totalExpense);
  };

  const fetchPortfolioData = async () => {
    const { data } = await supabase.from("investments").select("*").order("created_at", { ascending: false });
    if (data) {
      setInvestments(data);
      calculateSummary(data);
      updateLivePrices(data);
    }
  };

  const calculateSummary = (data: any[]) => {
    let invested = 0; let current = 0;
    data.forEach(item => {
      invested += (Number(item.quantity) * Number(item.purchase_price));
      current += (Number(item.quantity) * Number(item.current_price));
    });
    setSummary({ totalInvested: invested, currentValue: current, totalProfit: current - invested });
  };

  const updateLivePrices = async (currentData: any[]) => {
    setIsRefreshing(true);
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const usdToMyrRate = 4.7; 
    
    const updatedPortfolio = await Promise.all(currentData.map(async (inv) => {
      let livePrice = inv.current_price;
      try {
        if (inv.asset_class === 'Stock' && inv.ticker_symbol && finnhubKey) {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${inv.ticker_symbol}&token=${finnhubKey}`);
          const data = await res.json();
          if (data && data.c > 0) livePrice = data.c * usdToMyrRate;
        } 
        else if (inv.asset_class === 'Crypto' && inv.asset_name) {
          const coinId = inv.asset_name.toLowerCase();
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=myr`);
          const data = await res.json();
          if (data[coinId] && data[coinId].myr) livePrice = data[coinId].myr;
        } 
        else if (inv.asset_class === 'Commodity') {
          let proxyId = ""; const nameCheck = inv.asset_name.toLowerCase();
          if (nameCheck.includes("gold") || inv.ticker_symbol === "XAU") proxyId = "pax-gold";
          if (nameCheck.includes("silver") || inv.ticker_symbol === "XAG") proxyId = "kinesis-silver";
          if (proxyId) {
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${proxyId}&vs_currencies=myr`);
            const data = await res.json();
            if (data[proxyId] && data[proxyId].myr) livePrice = data[proxyId].myr;
          }
        }
      } catch (error) { console.error("Failed to fetch live price"); }

      if (livePrice !== inv.current_price) {
        await supabase.from("investments").update({ current_price: livePrice }).eq("id", inv.id);
      }
      return { ...inv, current_price: livePrice };
    }));

    setInvestments(updatedPortfolio);
    calculateSummary(updatedPortfolio);
    setIsRefreshing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalInvested = parseFloat(totalInvestedInput);
    
    // Prevent overdrawing Liquid Cash
    if (totalInvested > liquidCash) {
      setStatus("Error: Insufficient Liquid Cash!");
      setTimeout(() => setStatus(""), 3000);
      return;
    }

    setStatus("Executing Trade...");
    let livePrice = 0; 
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    const usdToMyrRate = 4.7;

    try {
      if (assetClass === 'Stock' && ticker && finnhubKey) {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${finnhubKey}`);
        const data = await res.json();
        if (data && data.c > 0) livePrice = data.c * usdToMyrRate;
      } 
      else if (assetClass === 'Crypto' && assetName) {
        const coinId = assetName.toLowerCase();
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=myr`);
        const data = await res.json();
        if (data[coinId] && data[coinId].myr) livePrice = data[coinId].myr;
      } 
      else if (assetClass === 'Commodity') {
        let proxyId = ""; const nameCheck = assetName.toLowerCase();
        if (nameCheck.includes("gold") || ticker.toUpperCase() === "XAU") proxyId = "pax-gold";
        if (nameCheck.includes("silver") || ticker.toUpperCase() === "XAG") proxyId = "kinesis-silver";
        if (proxyId) {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${proxyId}&vs_currencies=myr`);
          const data = await res.json();
          if (data[proxyId] && data[proxyId].myr) livePrice = data[proxyId].myr;
        }
      }
    } catch (error) { console.error("Failed on submit"); }

    if (livePrice === 0 || assetClass === 'Real Estate') livePrice = totalInvested;
    const calculatedQuantity = assetClass === 'Real Estate' ? 1 : (totalInvested / livePrice);
    
    const { error } = await supabase.from("investments").insert([{
        asset_name: assetName, ticker_symbol: ticker.toUpperCase(), asset_class: assetClass,
        quantity: calculatedQuantity, purchase_price: livePrice, current_price: livePrice,
    }]);

    if (!error) {
      await supabase.from("transactions").insert([{
        amount: totalInvested, category: `Investment: ${assetName}`, type: "expense",
        description: "Asset Purchase", date: new Date().toISOString().split('T')[0]
      }]);

      setStatus("Success");
      setAssetName(""); setTicker(""); setTotalInvestedInput(""); setAssetClass("Stock");
      fetchPortfolioData();
      fetchLiquidCash(); // Refresh cash after purchase
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("Error: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (!error) {
      const filtered = investments.filter(inv => inv.id !== id);
      setInvestments(filtered); calculateSummary(filtered);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch(type) {
      case 'Crypto': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Real Estate': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Commodity': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-sky-500/10 text-sky-400 border-sky-500/20'; 
    }
  };

  return (
    <div className="min-h-full bg-[#0B0F19] rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-8 m-2 md:m-4 shadow-2xl text-slate-50 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER WITH LIQUID CASH BADGE */}
      <header className="mb-6 md:mb-10 px-2 md:px-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Portfolio</h1>
          <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">Your investments, real-time.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 md:px-5 py-2 md:py-3 rounded-2xl text-right animate-in zoom-in-95">
          <p className="text-[9px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Available Cash</p>
          <p className="text-base md:text-xl font-extrabold text-emerald-300">RM {liquidCash.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
        </div>
      </header>

      {/* Top Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50 shadow-xl group">
          {isRefreshing && <div className="absolute inset-0 bg-sky-500/5 animate-pulse"></div>}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500 rounded-full mix-blend-screen filter blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider relative z-10">Live Value</h3>
          <p className="text-3xl md:text-4xl font-extrabold text-white relative z-10">RM {summary.currentValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50">
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider">Capital Invested</h3>
          <p className="text-2xl md:text-3xl font-bold text-slate-300">RM {summary.totalInvested.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-800/50">
          <h3 className="text-xs md:text-sm font-bold text-slate-500 mb-1 md:mb-2 uppercase tracking-wider">All-Time Return</h3>
          <p className={`text-2xl md:text-3xl font-extrabold ${summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.totalProfit >= 0 ? '+' : ''}RM {summary.totalProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        <div className="lg:col-span-4">
          <div className="bg-slate-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/50">
            <h2 className="text-lg md:text-xl font-bold mb-6 md:mb-8 text-white">Execute Trade</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              
              <div className="relative group">
                <select value={assetClass} onChange={(e) => setAssetClass(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 text-white appearance-none cursor-pointer text-sm md:text-base">
                  <option value="Stock">Stock / ETF</option>
                  <option value="Crypto">Cryptocurrency</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Commodity">Commodity</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">▼</div>
              </div>

              <input type="text" required value={assetName} onChange={(e) => setAssetName(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 text-white placeholder-slate-600 text-sm md:text-base" placeholder="Asset Name (e.g., Apple)" />

              {assetClass === 'Stock' && (
                <input type="text" required value={ticker} onChange={(e) => setTicker(e.target.value)} className="w-full p-3.5 md:p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 text-white placeholder-slate-600 text-sm md:text-base" placeholder="Ticker (e.g., AAPL)" />
              )}

              <div className="p-4 md:p-5 bg-sky-500/5 rounded-2xl border border-sky-500/20 mt-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl"></div>
                <label className="block text-xs md:text-sm font-bold text-sky-400 mb-2 relative z-10">Total Capital (RM)</label>
                <input type="number" step="0.01" required value={totalInvestedInput} onChange={(e) => setTotalInvestedInput(e.target.value)} className="w-full p-2 md:p-3 text-xl md:text-2xl font-bold text-white bg-transparent border-b border-sky-500/30 outline-none focus:border-sky-400 placeholder-slate-700 relative z-10" placeholder="0.00" />
                <p className="text-[10px] md:text-xs text-slate-400 mt-2 md:mt-3 relative z-10">App will auto-calculate quantity based on live market price.</p>
              </div>

              <button type="submit" className="mt-2 md:mt-4 w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-3.5 md:py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.15)] active:scale-[0.98] text-sm md:text-base">
                {status || "Buy Asset"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-800/30 h-full">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold text-white">Your Holdings</h2>
              <button onClick={() => updateLivePrices(investments)} disabled={isRefreshing} className="flex items-center gap-2 text-xs md:text-sm font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-3 md:px-4 py-2 md:py-2.5 rounded-xl transition-all disabled:opacity-50">
                <svg className={`w-3 h-3 md:w-4 md:h-4 ${isRefreshing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><polyline points="21 3 21 8 16 8"></polyline></svg>
                {isRefreshing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {investments.map((inv) => {
                const totalCost = Number(inv.quantity) * Number(inv.purchase_price);
                const totalValue = Number(inv.quantity) * Number(inv.current_price);
                const profit = totalValue - totalCost;
                const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;

                return (
                  <div key={inv.id} className="bg-slate-950/40 border border-slate-800/50 p-4 md:p-5 rounded-2xl hover:bg-slate-900/60 transition-colors relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-extrabold text-white text-base md:text-lg">{inv.ticker_symbol || inv.asset_name}</p>
                        <span className={`inline-block mt-1 text-[9px] md:text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(inv.asset_class)}`}>
                          {inv.asset_class}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-white text-base md:text-lg">RM {totalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                          <p className={`text-xs md:text-sm font-extrabold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {profit >= 0 ? '▲' : '▼'} {profitPercent.toFixed(2)}%
                          </p>
                        </div>
                        <button onClick={() => handleDelete(inv.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/50">
                      <div>
                        <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Invested</p>
                        <p className="text-xs md:text-sm text-slate-300 font-medium">RM {totalCost.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                      </div>
                      <div>
                         <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Live Price</p>
                         <p className="text-xs md:text-sm text-sky-400 font-bold">RM {Number(inv.current_price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Quantity</p>
                         <p className="text-xs md:text-sm text-slate-400 font-mono">{Number(inv.quantity).toLocaleString(undefined, {maximumFractionDigits: 4})}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {investments.length === 0 && (
                <p className="text-center text-slate-500 py-8 font-medium">No assets in portfolio.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
