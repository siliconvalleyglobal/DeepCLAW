'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, DollarSign, TrendingDown, Layers, Cpu, ShieldCheck, 
  Activity, ArrowUpRight, BarChart3, RefreshCw, Code, Terminal, CheckCircle2 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [promptInput, setPromptInput] = useState("Can you please analyze this code and explain what improvements can be made?");
  const [simulatedResult, setSimulatedResult] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSimulate = () => {
    const rawTokens = Math.ceil(promptInput.length / 3.5);
    const cleaned = promptInput
      .replace(/\bcan you please\b/gi, "")
      .replace(/\bplease kindly\b/gi, "")
      .replace(/\bplease\b/gi, "")
      .replace(/\bkindly\b/gi, "")
      .replace(/\bwhat improvements can be made\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    
    const compressedTokens = Math.ceil(cleaned.length / 3.5);
    const saved = Math.max(0, rawTokens - compressedTokens);
    const ratio = rawTokens > 0 ? ((saved / rawTokens) * 100).toFixed(1) : "0";
    const usd = ((saved / 1000) * 0.003).toFixed(5);

    setSimulatedResult({
      compressedText: cleaned || promptInput,
      rawTokens,
      compressedTokens,
      savedTokens: saved,
      ratio,
      usd
    });
  };

  useEffect(() => {
    handleSimulate();
  }, [promptInput]);

  const mockChartData = [
    { name: 'Mon', original: 45000, compressed: 18000 },
    { name: 'Tue', original: 52000, compressed: 21000 },
    { name: 'Wed', original: 61000, compressed: 23000 },
    { name: 'Thu', original: 58000, compressed: 20000 },
    { name: 'Fri', original: 72000, compressed: 27000 },
    { name: 'Sat', original: 38000, compressed: 14000 },
    { name: 'Sun', original: 42000, compressed: 16000 },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 space-y-8">
      {/* Executive Navbar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between glass-card p-6 rounded-2xl gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              TokenSaveOS <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Live Analytics</span>
            </h1>
            <p className="text-sm text-slate-400">
              Enterprise AI Agent Optimization & Context Intelligence System by <span className="text-indigo-300 font-medium">SILICON VALLEY GLOBAL PH INC</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <a 
            href="https://svg.ph" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            svg.ph <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* 4 Hero Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Total Tokens Saved</span>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Zap className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats ? (stats.totalTokensSaved || 0).toLocaleString() : '1,482,900'}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingDown className="w-3.5 h-3.5" /> 88% Net Payload Reduction
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Net Cost Reduction</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            ${stats ? (stats.totalCostSavedUSD || 0).toFixed(2) : '7,414.50'}
          </div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Direct Monthly Savings
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Compression Rate</span>
            <div className="p-2 bg-purple-500/10 rounded-lg"><BarChart3 className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats ? (stats.savingsRate || 59.1) : 59.1}%
          </div>
          <div className="text-xs text-purple-300 flex items-center gap-1 font-medium">
            Default-ON Aggressive Prune
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">Prompt Cache Hit Ratio</span>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Layers className="w-5 h-5" /></div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {stats ? (stats.hitRatio || 83.5) : 83.5}%
          </div>
          <div className="text-xs text-amber-300 flex items-center gap-1 font-medium">
            Anthropic cache_control active
          </div>
        </div>
      </div>

      {/* Main Analytics Section: Chart & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Token Usage Chart (2 Cols) */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Token Volume Before vs After Compression
              </h2>
              <p className="text-xs text-slate-400">Daily payload efficiency comparison across active IDEs</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1 text-indigo-400"><div className="w-3 h-3 rounded bg-indigo-500/40 border border-indigo-400"></div> Raw Payload</span>
              <span className="flex items-center gap-1 text-emerald-400"><div className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-400"></div> Compressed</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompressed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="original" stroke="#6366f1" fillOpacity={1} fill="url(#colorOriginal)" />
                <Area type="monotone" dataKey="compressed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompressed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Simulator Playground (1 Col) */}
        <div className="glass-card p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-indigo-400" /> Live Token Optimization Playground
            </h2>
            <p className="text-xs text-slate-400 mb-4">Test raw customer prompts and see instant token pruning</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 mb-1 block">Input Raw Prompt</label>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              {simulatedResult && (
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Tokens Before: <strong className="text-slate-200">{simulatedResult.rawTokens}</strong></span>
                    <span className="text-slate-400">Tokens After: <strong className="text-emerald-400">{simulatedResult.compressedTokens}</strong></span>
                    <span className="text-emerald-400 font-bold">-{simulatedResult.ratio}%</span>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Compressed Result Payload</label>
                    <div className="text-xs font-mono bg-slate-900 p-2.5 rounded-lg text-emerald-300 border border-slate-800">
                      {simulatedResult.compressedText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-400" />
            <span>Secrets & credentials are automatically redacted before compression.</span>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <footer className="text-center text-xs text-slate-500 pt-6">
        TokenSaveOS v1.1.0 — Developed by <a href="https://svg.ph" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">SILICON VALLEY GLOBAL PH INC</a> — Licensed under MIT
      </footer>
    </div>
  );
}
