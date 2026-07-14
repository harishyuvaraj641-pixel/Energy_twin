import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Zap, Gauge, Leaf, Battery, TreePine, IndianRupee,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';

/* ─── tiny sparkline ─── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="ml-auto">
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} />
    </svg>
  );
}

/* ─── animated counter ─── */
function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    let start = display;
    const diff = value - start;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(start + (diff * step) / steps);
      if (step >= steps) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

/* ─── stat card ─── */
interface StatCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  trend: number;
  sparkData: number[];
  decimals?: number;
  index: number;
}

function StatCard({ title, value, unit, icon, color, trend, sparkData, decimals = 0, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="glass-card p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: `${color}18` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <span className="text-text-secondary text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {trend >= 0 ? (
            <TrendingUp size={14} className="text-neon-green" />
          ) : (
            <TrendingDown size={14} className="text-neon-red" />
          )}
          <span className={trend >= 0 ? 'text-neon-green' : 'text-neon-red'}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between mt-1">
        <div>
          <span className="text-2xl font-bold" style={{ color }}>
            <AnimatedCounter value={value} decimals={decimals} />
          </span>
          <span className="text-text-secondary text-sm ml-1">{unit}</span>
        </div>
        <Sparkline data={sparkData} color={color} />
      </div>
    </motion.div>
  );
}

/* ─── main component ─── */
const PIE_COLORS = ['#ffd700', '#00f5ff', '#8892a4', '#4361ee'];

function EnergyOverview() {
  const { currentData, historyData } = useSimulation();

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const sparkBase = () => Array.from({ length: 12 }, () => Math.random());
  const totalProduction = currentData.solarProduction + currentData.windProduction;

  const stats: Omit<StatCardProps, 'index'>[] = [
    {
      title: 'Total Production',
      value: totalProduction,
      unit: 'kW',
      icon: <Zap size={18} />,
      color: '#00f5ff',
      trend: 3.2,
      sparkData: sparkBase().map((v) => totalProduction * (0.85 + v * 0.3)),
    },
    {
      title: 'Total Demand',
      value: currentData.totalDemand,
      unit: 'kW',
      icon: <Gauge size={18} />,
      color: '#e0e6ed',
      trend: -1.4,
      sparkData: sparkBase().map((v) => currentData.totalDemand * (0.88 + v * 0.24)),
    },
    {
      title: 'Renewable %',
      value: currentData.renewablePercentage,
      unit: '%',
      icon: <Leaf size={18} />,
      color: '#39ff14',
      trend: 5.7,
      sparkData: sparkBase().map((v) => 60 + v * 30),
    },
    {
      title: 'Battery Level',
      value: currentData.batteryLevel,
      unit: '%',
      icon: <Battery size={18} />,
      color: '#4361ee',
      trend: 2.1,
      sparkData: sparkBase().map((v) => 50 + v * 40),
      decimals: 1,
    },
    {
      title: 'Carbon Saved',
      value: currentData.carbonSaved,
      unit: 'tons',
      icon: <TreePine size={18} />,
      color: '#39ff14',
      trend: 8.3,
      sparkData: sparkBase().map((v) => 100 + v * 60),
      decimals: 1,
    },
    {
      title: 'Cost Savings',
      value: currentData.costSavings,
      unit: '₹',
      icon: <IndianRupee size={18} />,
      color: '#ffd700',
      trend: 4.6,
      sparkData: sparkBase().map((v) => 250000 + v * 100000),
    },
  ];

  const solar = currentData.solarProduction;
  const wind = currentData.windProduction;
  const grid = currentData.gridImport;
  const battery = Math.max(0, currentData.totalDemand - (solar + wind + grid));
  
  const totalMix = solar + wind + grid + battery || 1;
  const solarPercent = Math.round((solar / totalMix) * 100);
  const windPercent = Math.round((wind / totalMix) * 100);
  const gridPercent = Math.round((grid / totalMix) * 100);
  const batteryPercent = 100 - (solarPercent + windPercent + gridPercent);

  const energyMix = [
    { name: 'Solar', value: solarPercent },
    { name: 'Wind', value: windPercent },
    { name: 'Grid', value: gridPercent },
    { name: 'Battery', value: batteryPercent },
  ];

  const productionHistory = historyData.map((h) => {
    const date = new Date(h.timestamp);
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return {
      time,
      solar: h.solarProduction,
      wind: h.windProduction,
      demand: h.totalDemand,
    };
  });

  return (
    <div className="space-y-6">
      {/* ── stat cards 3×2 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <StatCard key={s.title} {...s} index={i} />
        ))}
      </div>

      {/* ── charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* production vs demand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-4 text-text-primary">
            Production vs Demand — Last 24 h
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={productionHistory}>
              <defs>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd700" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ffd700" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" stroke="#8892a4" fontSize={11} />
              <YAxis stroke="#8892a4" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,22,40,0.95)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  borderRadius: 10,
                }}
              />
              <Area type="monotone" dataKey="solar" stackId="1" stroke="#ffd700" fill="url(#solarGrad)" />
              <Area type="monotone" dataKey="wind" stackId="1" stroke="#00f5ff" fill="url(#windGrad)" />
              <Area
                type="monotone"
                dataKey="demand"
                stroke="#ff0844"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* energy mix donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-5 flex flex-col items-center justify-center"
        >
          <h3 className="text-lg font-semibold mb-2 text-text-primary">Energy Mix</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={energyMix}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {energyMix.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                wrapperStyle={{ color: '#8892a4', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,22,40,0.95)',
                  border: '1px solid rgba(0,245,255,0.2)',
                  borderRadius: 10,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

export default EnergyOverview;
