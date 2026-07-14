// ─── AI Grid Optimization Recommendations ──────────────────────────────────
// Evaluates placed asset counts and live telemetry to recommend cost-saving
// and carbon-reducing actions. Aggregates potential metrics in real-time.
// ────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sun,
  BatteryCharging,
  Car,
  Lightbulb,
  ArrowUpRight,
  HardDrive,
  CheckCircle2,
  X,
  TrendingUp,
} from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  savings: string;
  co2: string;
  roi: string;
  priority: 'High' | 'Medium' | 'Low';
}

const priorityColor: Record<string, string> = {
  High: '#ff0844',
  Medium: '#ff6b35',
  Low: '#39ff14',
};

function AIOptimization() {
  const { currentData, placedAssets } = useSimulation();

  // Placed resource counts
  const counts = useMemo(() => {
    const assets = placedAssets;
    return {
      solar: assets.filter((a) => a.type === 'solar').length,
      wind: assets.filter((a) => a.type === 'wind').length,
      battery: assets.filter((a) => a.type === 'battery').length,
      ev: assets.filter((a) => a.type === 'ev').length,
      commercial: assets.filter((a) => a.type === 'commercial').length,
      residential: assets.filter((a) => a.type === 'residential').length,
    };
  }, [placedAssets]);

  // Construct dynamic recommendations
  const initialRecs: Recommendation[] = useMemo(() => {
    const list: Recommendation[] = [];

    // Rec 1: Solar
    if (counts.solar === 0) {
      list.push({
        id: 1,
        title: 'Install Additional Solar Panels',
        description: 'Deploy a solar array on rooftop zones to generate free daytime power.',
        icon: <Sun size={22} />,
        savings: '₹12L/year',
        co2: '−200 t/year',
        roi: '2.5 years',
        priority: 'High',
      });
    } else if (counts.solar < 8) {
      list.push({
        id: 1,
        title: 'Expand Active Solar Capacity',
        description: `Currently ${counts.solar} Solar arrays active. Expand capacity to fully offset midday peaks.`,
        icon: <Sun size={22} />,
        savings: `₹${(6 * counts.solar).toFixed(1)}L/year`,
        co2: `−${80 * counts.solar} t/year`,
        roi: '2.2 years',
        priority: 'Medium',
      });
    }

    // Rec 2: Battery sunset charging
    if (counts.battery > 0) {
      list.push({
        id: 2,
        title: 'Pre-charge Batteries Before Sunset',
        description: `Shift charging of your ${counts.battery} battery banks to peak solar hours (11 AM - 3 PM) to avoid grid tariffs.`,
        icon: <BatteryCharging size={22} />,
        savings: `₹${(1.5 * counts.battery).toFixed(1)}L/month`,
        co2: `−${20 * counts.battery} t/month`,
        roi: 'Immediate',
        priority: 'High',
      });
    } else {
      list.push({
        id: 2,
        title: 'Deploy Battery Storage Bank',
        description: 'No batteries placed. Add Battery Storage to cushion evening loads with daytime solar surplus.',
        icon: <BatteryCharging size={22} />,
        savings: '₹0/month',
        co2: '−0 t/month',
        roi: 'Immediate',
        priority: 'Low',
      });
    }

    // Rec 3: EV charge slots
    if (counts.ev > 0) {
      list.push({
        id: 3,
        title: 'Delay EV Charging to Off-Peak',
        description: `Restrict EV charging at all ${counts.ev} active stations to off-peak slots (11 PM - 5 AM) to save on rates.`,
        icon: <Car size={22} />,
        savings: `₹${(0.8 * counts.ev).toFixed(1)}L/month`,
        co2: `−${12 * counts.ev} t/month`,
        roi: 'Immediate',
        priority: 'Medium',
      });
    }

    // Rec 4: Commercial Lighting
    if (counts.commercial > 0) {
      list.push({
        id: 4,
        title: 'Reduce Commercial Lighting 8 PM–6 AM',
        description: `Dim non-essential lighting by 60% for ${counts.commercial} active office zones to shave baseline load.`,
        icon: <Lightbulb size={22} />,
        savings: `₹${(1.2 * counts.commercial).toFixed(1)}L/month`,
        co2: `−${18 * counts.commercial} t/month`,
        roi: 'Immediate',
        priority: 'Medium',
      });
    }

    // Rec 5: Solar export
    if (counts.solar > 0) {
      list.push({
        id: 5,
        title: 'Export Excess Solar to Grid',
        description: 'Sell surplus daytime solar generation back to state grid during high generation ticks.',
        icon: <ArrowUpRight size={22} />,
        savings: `₹${(2 * counts.solar).toFixed(1)}L/month`,
        co2: `−${35 * counts.solar} t/month`,
        roi: 'Immediate',
        priority: 'Low',
      });
    }

    // Rec 6: Battery bank upgrades
    if (counts.battery === 0) {
      list.push({
        id: 6,
        title: 'Upgrade Battery Storage +5000 kWh',
        description: 'Deploy battery banks to establish a localized emergency microgrid backup.',
        icon: <HardDrive size={22} />,
        savings: '₹8L/year',
        co2: '−150 t/year',
        roi: '3 years',
        priority: 'High',
      });
    } else if (counts.battery < 5) {
      list.push({
        id: 6,
        title: 'Upgrade Battery Storage +5000 kWh',
        description: `Expand active battery banks (currently ${counts.battery}) to extend backup duration.`,
        icon: <HardDrive size={22} />,
        savings: `₹${(4 * counts.battery).toFixed(1)}L/year`,
        co2: `−${75 * counts.battery} t/year`,
        roi: '3 years',
        priority: 'Low',
      });
    }

    return list;
  }, [counts]);

  const [recs, setRecs] = useState<Recommendation[]>([]);

  // Sync state with calculated recommendations whenever placedAssets changes
  useEffect(() => {
    setRecs(initialRecs);
  }, [initialRecs]);

  const dismiss = (id: number) => setRecs((prev) => prev.filter((r) => r.id !== id));

  // Dynamic calculations for summary boxes
  const totals = useMemo(() => {
    let lakhsYear = 0;
    let co2TonsYear = 0;

    recs.forEach((r) => {
      // Parse savings (e.g. ₹12L/year, ₹3L/month)
      const savMatch = r.savings.match(/₹([\d.]+)L\/(year|month)/);
      if (savMatch) {
        const val = parseFloat(savMatch[1]);
        const isYear = savMatch[2] === 'year';
        lakhsYear += isYear ? val : val * 12;
      }

      // Parse CO2 reduction (e.g. −200 t/year, −40 t/month)
      const co2Match = r.co2.match(/[−-]([\d.]+) t\/(year|month)/);
      if (co2Match) {
        const val = parseFloat(co2Match[1]);
        const isYear = co2Match[2] === 'year';
        co2TonsYear += isYear ? val : val * 12;
      }
    });

    return {
      savingsStr: `₹${lakhsYear.toFixed(1)} L/year`,
      co2Str: `${Math.round(co2TonsYear)} tons/year`,
    };
  }, [recs]);

  // Optimization score scales with renewable share of total load
  const optimizationScore = currentData ? Math.round(currentData.renewablePercentage) : 0;

  return (
    <div className="space-y-6">
      {/* ── top summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* optimization score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 flex flex-col items-center justify-center text-center"
        >
          <span className="text-text-secondary text-sm mb-2 font-semibold">Optimization Score</span>
          <div className="relative w-32 h-32 mb-2">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#00f5ff"
                strokeWidth="3.5"
                strokeDasharray={`${optimizationScore} ${100 - optimizationScore}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-neon-cyan">
              {optimizationScore}%
            </span>
          </div>
          <span className="text-[10px] text-text-secondary">Based on renewable mix ratio</span>
        </motion.div>

        {/* potential savings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 flex flex-col items-center justify-center text-center"
        >
          <TrendingUp size={28} className="text-neon-gold mb-2" />
          <span className="text-text-secondary text-sm mb-1 font-semibold">Total Potential Savings</span>
          <span className="text-3xl font-bold text-neon-gold">{totals.savingsStr}</span>
        </motion.div>

        {/* CO₂ reduction */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col items-center justify-center text-center"
        >
          <Sun size={28} className="text-neon-green mb-2" />
          <span className="text-text-secondary text-sm mb-1 font-semibold">CO₂ Reduction Potential</span>
          <span className="text-3xl font-bold text-neon-green">{totals.co2Str}</span>
        </motion.div>
      </div>

      {/* ── recommendation cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {recs.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: 'spring', stiffness: 260, damping: 20 }}
            className="glass-card p-5 flex flex-col gap-3 relative overflow-hidden border border-white/5 hover:border-white/10"
          >
            {/* priority badge */}
            <span
              className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                color: priorityColor[r.priority],
                background: `${priorityColor[r.priority]}18`,
                border: `1px solid ${priorityColor[r.priority]}40`,
              }}
            >
              {r.priority}
            </span>

            {/* header */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-cyan/10 text-neon-cyan">{r.icon}</div>
              <h4 className="font-semibold text-sm pr-14 text-white">{r.title}</h4>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">{r.description}</p>

            {/* metrics */}
            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div className="glass rounded-lg p-2 bg-white/[0.02]">
                <p className="text-[10px] text-text-secondary">Savings</p>
                <p className="text-xs font-bold text-neon-gold">{r.savings}</p>
              </div>
              <div className="glass rounded-lg p-2 bg-white/[0.02]">
                <p className="text-[10px] text-text-secondary">CO₂</p>
                <p className="text-xs font-bold text-neon-green">{r.co2}</p>
              </div>
              <div className="glass rounded-lg p-2 bg-white/[0.02]">
                <p className="text-[10px] text-text-secondary">ROI</p>
                <p className="text-xs font-bold text-neon-cyan">{r.roi}</p>
              </div>
            </div>

            {/* actions */}
            <div className="flex gap-2 mt-4">
              <button className="btn-neon-solid flex-1 flex items-center justify-center gap-1 !py-2 text-xs cursor-pointer">
                <CheckCircle2 size={14} /> Accept
              </button>
              <button
                onClick={() => dismiss(r.id)}
                className="btn-danger flex items-center justify-center gap-1 !py-2 !px-3 text-xs cursor-pointer"
              >
                <X size={14} /> Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AIOptimization;
