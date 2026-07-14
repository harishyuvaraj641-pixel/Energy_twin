// ─── AI Demand Forecasting Panel ──────────────────────────────────────────
// Displays live demand forecasting charts (with historical vs predicted lines
// and confidence bands), weather conditions, and key predictions based
// exclusively on user-placed assets and simulation ticks.
// ───────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Cloud, Wind, Thermometer, CloudRain, Target, Clock } from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';

type Range = 'hour' | '6hours' | 'day' | 'week';

const tabs: { key: Range; label: string }[] = [
  { key: 'hour', label: 'Next Hour' },
  { key: '6hours', label: 'Next 6 Hours' },
  { key: 'day', label: 'Next Day' },
  { key: 'week', label: 'Next Week' },
];

function ForecastPanel() {
  const { currentData, placedAssets } = useSimulation();
  const [range, setRange] = useState<Range>('day');

  // Fallback if simulation data is not loaded yet
  if (!currentData) {
    return (
      <div className="h-[400px] flex items-center justify-center text-text-secondary text-sm">
        <Clock className="w-5 h-5 animate-spin mr-2 text-neon-cyan" />
        Synchronizing real-time forecasting context...
      </div>
    );
  }

  const {
    totalDemand,
    solarProduction,
    windProduction,
    batteryLevel,
    cloudCover,
    windSpeed,
    temperature,
    rainProbability,
    timeOfDay,
  } = currentData;

  // ─── Generate Real-time Forecast Data ──────────────────────────────────────
  const forecastData = useMemo(() => {
    const points = [];
    const counts: Record<Range, number> = { hour: 12, '6hours': 36, day: 48, week: 56 };
    const n = counts[range];
    const splitIdx = Math.floor(n * 0.5);

    for (let i = 0; i < n; i++) {
      const isHistorical = i < splitIdx;
      let hourOffset = 0;
      let label = '';

      if (range === 'hour') {
        hourOffset = ((i - splitIdx) * 5) / 60;
        label = `${(i - splitIdx) * 5}m`;
        if (i === splitIdx) label = 'Now';
      } else if (range === '6hours') {
        hourOffset = ((i - splitIdx) * 10) / 60;
        label = `${(i - splitIdx) * 10}m`;
        if (i === splitIdx) label = 'Now';
      } else if (range === 'day') {
        hourOffset = (i - splitIdx) * 0.5;
        const targetHour = (timeOfDay + hourOffset + 24) % 24;
        const hStr = Math.floor(targetHour).toString().padStart(2, '0');
        const mStr = targetHour % 1 >= 0.5 ? '30' : '00';
        label = `${hStr}:${mStr}`;
      } else {
        hourOffset = (i - splitIdx) * 3;
        const daysOffset = Math.floor((timeOfDay + hourOffset) / 24);
        label = `D+${daysOffset >= 0 ? daysOffset : 0}`;
        if (i === splitIdx) label = 'Today';
      }

      // Base diurnal factor sin curve peaking at 19:00 (7 PM)
      const targetHour = (timeOfDay + hourOffset + 24) % 24;
      const diurnalFactor = 0.78 + 0.22 * Math.sin(((targetHour - 13) / 24) * 2 * Math.PI);
      
      // Add slight noise
      const noise = 1 + (Math.sin(i * 1.8) * 0.02 + (Math.random() * 0.015 - 0.0075));
      const val = totalDemand * diurnalFactor * noise;

      points.push({
        time: label,
        historical: isHistorical ? Math.round(val) : null,
        predicted: !isHistorical ? Math.round(val) : null,
        upper: !isHistorical ? Math.round(val * 1.1) : null,
        lower: !isHistorical ? Math.round(val * 0.9) : null,
      });
    }
    return points;
  }, [range, totalDemand, timeOfDay]);

  // Dynamic accuracy score (improves slightly with more placed assets for tracking)
  const accuracy = Math.min(99.4, 91.2 + Math.min(5, placedAssets.length * 0.15));
  const accColor = accuracy >= 95 ? '#39ff14' : accuracy >= 88 ? '#ffd700' : '#ff0844';

  // ─── Weather Impact Cards ──────────────────────────────────────────────────
  const weatherCards = [
    {
      icon: <Cloud size={22} />,
      label: 'Cloud Cover',
      value: `${cloudCover}%`,
      impact: cloudCover > 40 ? `Solar −${Math.round(cloudCover * 0.8)}%` : 'Optimal Solar',
      color: '#ffd700',
    },
    {
      icon: <Wind size={22} />,
      label: 'Wind Speed',
      value: `${Math.round(windSpeed * 3.6)} km/h`,
      impact: windSpeed > 3 ? `Wind +${Math.round((windSpeed / 12) ** 3 * 100)}%` : 'No Wind',
      color: '#00f5ff',
    },
    {
      icon: <Thermometer size={22} />,
      label: 'Temperature',
      value: `${Math.round(temperature)}°C`,
      impact: temperature > 30 ? `Demand +${Math.round((temperature - 30) * 2)}%` : 'Normal Load',
      color: '#ff6b35',
    },
    {
      icon: <CloudRain size={22} />,
      label: 'Rain Chance',
      value: `${rainProbability}%`,
      impact: rainProbability > 30 ? 'Load Shift −5%' : 'No Outage Risk',
      color: '#4361ee',
    },
  ];

  // ─── Dynamic Bullet Predictions ───────────────────────────────────────────
  const dynamicPredictions = useMemo(() => {
    const list = [];
    
    // Prediction 1: Peak demand estimate
    const peakEstimate = Math.round(totalDemand * 1.22);
    list.push(`Peak demand predicted at 7:30 PM (approx ${peakEstimate.toLocaleString()} kW)`);

    // Prediction 2: Solar cloud cover impact
    if (cloudCover > 50) {
      list.push(`Solar production will experience a ${Math.round(cloudCover * 0.8)}% attenuation today due to high cloudiness.`);
    } else {
      list.push(`Solar systems operating at high efficiency (${(100 - cloudCover * 0.5).toFixed(0)}% optimal output expected).`);
    }

    // Prediction 3: Placed clean offset power
    const offsetPower = solarProduction + windProduction;
    list.push(
      offsetPower > 0
        ? `Clean resources (${placedAssets.filter(a => a.type === 'solar' || a.type === 'wind').length} active) are offsetting ${Math.round(offsetPower).toLocaleString()} kW of grid demand.`
        : 'Zero clean offset. Deploy wind turbines or solar panels to reduce grid dependency.'
    );

    // Prediction 4: Battery reserves status
    const batteryCount = placedAssets.filter(a => a.type === 'battery').length;
    if (batteryCount > 0) {
      list.push(
        batteryLevel > 30
          ? `Battery banks (${batteryLevel}% SOC) are ready to cushion the peak evening loads.`
          : `Battery storage reserves are low (${batteryLevel}%). Prioritizing charging cycle.`
      );
    } else {
      list.push('No battery banks deployed. Add Battery Storage to pool excess day solar output.');
    }

    return list;
  }, [totalDemand, cloudCover, solarProduction, windProduction, batteryLevel, placedAssets]);

  return (
    <div className="space-y-6">
      {/* Tab selection */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setRange(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              range === t.key
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_10px_rgba(0,245,255,0.1)]'
                : 'glass text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main chart + accuracy card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-5 lg:col-span-3"
        >
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-neon-cyan" /> Demand Forecast
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bf00ff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#bf00ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#8892a4" fontSize={11} tickLine={false} />
              <YAxis stroke="#8892a4" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,22,40,0.95)',
                  border: '1px solid rgba(0,245,255,0.15)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 11,
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#confGrad)"
                name="Confidence Upper"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="url(#confGrad)"
                name="Confidence Lower"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#00f5ff"
                fill="none"
                strokeWidth={2}
                name="Historical"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#bf00ff"
                fill="none"
                strokeWidth={2}
                strokeDasharray="6 3"
                name="Predicted"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Accuracy Gauge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 flex flex-col items-center justify-center text-center"
        >
          <Target size={28} style={{ color: accColor }} className="mb-2" />
          <span className="text-text-secondary text-xs uppercase tracking-wider mb-1 font-semibold">Forecast Accuracy</span>
          <div className="relative w-32 h-32 my-3">
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
                stroke={accColor}
                strokeWidth="3.5"
                strokeDasharray={`${accuracy} ${100 - accuracy}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
              style={{ color: accColor }}
            >
              {accuracy.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-text-secondary mt-1">Refined from active tracking nodes</span>
        </motion.div>
      </div>

      {/* Weather impact cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-neon-cyan uppercase tracking-wider">Weather Conditions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weatherCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card p-4 flex flex-col gap-1 border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-2" style={{ color: c.color }}>
                {c.icon}
                <span className="text-xs font-medium text-text-secondary">{c.label}</span>
              </div>
              <span className="text-xl font-bold text-white mt-1">{c.value}</span>
              <span className="text-[10px]" style={{ color: c.color }}>
                {c.impact}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bullet predictions list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-5"
      >
        <h3 className="text-xs font-semibold text-neon-cyan uppercase tracking-wider mb-3">Key Predictions</h3>
        <ul className="space-y-2">
          {dynamicPredictions.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-text-secondary leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-neon-cyan shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

export default ForecastPanel;
