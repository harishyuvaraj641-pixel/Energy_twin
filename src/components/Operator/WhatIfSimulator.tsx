import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { RotateCcw, Play, Leaf, DollarSign, Factory, Plug } from 'lucide-react';

/* ─── slider config ─── */
interface SliderDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  unit: string;
  prefix?: string;
}

const sliders: SliderDef[] = [
  { key: 'solarPanels', label: 'Solar Panels', min: 100, max: 10000, step: 100, defaultVal: 2000, unit: '' },
  { key: 'batteryCapacity', label: 'Battery Capacity', min: 1000, max: 50000, step: 500, defaultVal: 10000, unit: 'kWh' },
  { key: 'windTurbines', label: 'Wind Turbines', min: 0, max: 500, step: 5, defaultVal: 50, unit: '' },
  { key: 'evChargers', label: 'EV Chargers', min: 10, max: 1000, step: 10, defaultVal: 100, unit: '' },
  { key: 'popMultiplier', label: 'Population Multiplier', min: 0.5, max: 3.0, step: 0.1, defaultVal: 1.0, unit: 'x' },
  { key: 'cloudCoverage', label: 'Cloud Coverage', min: 0, max: 100, step: 1, defaultVal: 30, unit: '%' },
  { key: 'temperature', label: 'Temperature', min: 15, max: 45, step: 1, defaultVal: 32, unit: '°C' },
  { key: 'elecPrice', label: 'Electricity Price', min: 2, max: 15, step: 0.5, defaultVal: 6, unit: '/kWh', prefix: '₹' },
  { key: 'renewTarget', label: 'Renewable Target', min: 50, max: 100, step: 1, defaultVal: 80, unit: '%' },
];

function defaults(): Record<string, number> {
  const m: Record<string, number> = {};
  sliders.forEach((s) => (m[s.key] = s.defaultVal));
  return m;
}

/* ─── compute results ─── */
function compute(v: Record<string, number>) {
  const solarKW = v.solarPanels * 0.4 * ((100 - v.cloudCoverage) / 100);
  const windKW = v.windTurbines * 12;
  const totalRenewable = solarKW + windKW;
  const demand = 3000 * v.popMultiplier + v.evChargers * 7 + (v.temperature > 35 ? 500 : 0);
  const renewablePercent = Math.min(100, (totalRenewable / demand) * 100);
  const gridDep = Math.max(0, 100 - renewablePercent);
  const carbonReduction = totalRenewable * 0.0005;
  const costImpact = (totalRenewable * v.elecPrice - v.solarPanels * 0.8 - v.windTurbines * 50) / 1000;

  return {
    renewablePercent: Math.round(renewablePercent * 10) / 10,
    carbonReduction: Math.round(carbonReduction * 10) / 10,
    costImpact: Math.round(costImpact * 10) / 10,
    gridDependency: Math.round(gridDep * 10) / 10,
    solarKW: Math.round(solarKW),
    windKW: Math.round(windKW),
    gridKW: Math.max(0, Math.round(demand - totalRenewable)),
    batteryKW: Math.round(v.batteryCapacity * 0.04),
    demand: Math.round(demand),
  };
}

const PIE_COLORS = ['#ffd700', '#00f5ff', '#8892a4', '#4361ee'];

/* ─── component ─── */
function WhatIfSimulator() {
  const [values, setValues] = useState<Record<string, number>>(defaults);

  const set = useCallback((key: string, val: number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const result = useMemo(() => compute(values), [values]);
  const baseline = useMemo(() => compute(defaults()), []);

  const comparison = [
    { name: 'Renewable %', before: baseline.renewablePercent, after: result.renewablePercent },
    { name: 'Grid Dep %', before: baseline.gridDependency, after: result.gridDependency },
    { name: 'CO₂ Saved (t)', before: baseline.carbonReduction, after: result.carbonReduction },
  ];

  const pie = [
    { name: 'Solar', value: result.solarKW },
    { name: 'Wind', value: result.windKW },
    { name: 'Grid', value: result.gridKW },
    { name: 'Battery', value: result.batteryKW },
  ];

  const summaryCards = [
    { label: 'Renewable %', value: `${result.renewablePercent}%`, icon: <Leaf size={18} />, color: '#39ff14' },
    { label: 'Carbon Reduction', value: `${result.carbonReduction} t`, icon: <Factory size={18} />, color: '#00f5ff' },
    { label: 'Cost Impact', value: `₹${result.costImpact}K`, icon: <DollarSign size={18} />, color: '#ffd700' },
    { label: 'Grid Dependency', value: `${result.gridDependency}%`, icon: <Plug size={18} />, color: '#ff6b35' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── left: sliders ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-card p-5 lg:col-span-2 space-y-4 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Scenario Parameters</h3>
          <button
            onClick={() => setValues(defaults())}
            className="btn-neon flex items-center gap-1 !px-3 !py-1.5 text-xs"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        {sliders.map((s) => (
          <div key={s.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">{s.label}</span>
              <span className="text-neon-cyan font-mono text-xs">
                {s.prefix ?? ''}{values[s.key]}{s.unit}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={values[s.key]}
              onChange={(e) => set(s.key, parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                         bg-bg-hover accent-neon-cyan
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-neon-cyan
                         [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,245,255,0.5)]"
            />
          </div>
        ))}

        <button className="btn-neon-solid w-full mt-4 flex items-center justify-center gap-2">
          <Play size={16} /> Apply Scenario
        </button>
      </motion.div>

      {/* ── right: results ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-3 space-y-6"
      >
        {/* impact summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="glass-card p-4 text-center"
            >
              <div className="flex justify-center mb-1" style={{ color: c.color }}>
                {c.icon}
              </div>
              <p className="text-2xl font-bold" style={{ color: c.color }}>
                {c.value}
              </p>
              <p className="text-xs text-text-secondary mt-1">{c.label}</p>
            </motion.div>
          ))}
        </div>

        {/* comparison chart */}
        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold mb-4">Before vs After</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparison} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#8892a4" fontSize={11} />
              <YAxis stroke="#8892a4" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,22,40,0.95)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  borderRadius: 10,
                }}
              />
              <Bar dataKey="before" fill="#4a5568" radius={[4, 4, 0, 0]} name="Before" />
              <Bar dataKey="after" fill="#00f5ff" radius={[4, 4, 0, 0]} name="After" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* energy balance pie */}
        <div className="glass-card p-5 flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-2">Energy Balance</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pie}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pie.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ color: '#8892a4', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,22,40,0.95)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  borderRadius: 10,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

export default WhatIfSimulator;
