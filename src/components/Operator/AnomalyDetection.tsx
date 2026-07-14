import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle, AlertCircle, Info, Zap, Thermometer,
  TrendingUp, Radio, Search, Volume2, CheckCircle2, Clock,
} from 'lucide-react';

/* ─── types & data ─── */
type Severity = 'Critical' | 'Warning' | 'Info';

interface Anomaly {
  id: number;
  severity: Severity;
  type: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
}

const severityConfig: Record<Severity, { color: string; icon: React.ReactNode }> = {
  Critical: { color: '#ff0844', icon: <AlertCircle size={18} /> },
  Warning: { color: '#ffd700', icon: <AlertTriangle size={18} /> },
  Info: { color: '#4361ee', icon: <Info size={18} /> },
};

const anomalies: Anomaly[] = [
  { id: 1, severity: 'Critical', type: 'solar_fault', title: 'Solar Array B — Inverter Failure', description: 'Inverter #4 output dropped to zero. Immediate inspection required.', location: 'Solar Farm B, Sector 7', timestamp: '2 min ago' },
  { id: 2, severity: 'Critical', type: 'battery_overheat', title: 'Battery Bank 2 — Overheating', description: 'Temperature sensor reading 58°C, threshold is 55°C. Cooling fans activated.', location: 'Battery Storage, Building 3', timestamp: '8 min ago' },
  { id: 3, severity: 'Warning', type: 'consumption_spike', title: 'Zone-D Consumption Spike', description: 'Demand increased by 42% compared to baseline. Investigating cause.', location: 'Commercial Zone D', timestamp: '15 min ago' },
  { id: 4, severity: 'Warning', type: 'transformer_issue', title: 'Transformer T7 — Voltage Fluctuation', description: 'Output voltage oscillating ±5%. May affect connected loads.', location: 'Substation 3, Grid Junction', timestamp: '22 min ago' },
  { id: 5, severity: 'Warning', type: 'grid_instability', title: 'Grid Frequency Deviation', description: 'Grid frequency dipped to 49.85 Hz (normal 50 Hz). Monitoring.', location: 'Main Grid Connection', timestamp: '35 min ago' },
  { id: 6, severity: 'Info', type: 'solar_fault', title: 'Solar Panel A3 — Output Drop', description: 'Output decreased by 15%. Likely due to passing cloud cover.', location: 'Solar Farm A, Row 3', timestamp: '1 hr ago' },
  { id: 7, severity: 'Info', type: 'consumption_spike', title: 'EV Charging Cluster High Load', description: 'All 20 stations active simultaneously. Near capacity.', location: 'EV Hub North', timestamp: '1.5 hr ago' },
];

const trendData = [
  { day: 'Mon', solar_fault: 2, battery_overheat: 0, consumption_spike: 3, transformer_issue: 1, grid_instability: 0 },
  { day: 'Tue', solar_fault: 1, battery_overheat: 1, consumption_spike: 2, transformer_issue: 0, grid_instability: 1 },
  { day: 'Wed', solar_fault: 3, battery_overheat: 0, consumption_spike: 1, transformer_issue: 2, grid_instability: 0 },
  { day: 'Thu', solar_fault: 0, battery_overheat: 1, consumption_spike: 4, transformer_issue: 0, grid_instability: 1 },
  { day: 'Fri', solar_fault: 2, battery_overheat: 0, consumption_spike: 2, transformer_issue: 1, grid_instability: 0 },
  { day: 'Sat', solar_fault: 1, battery_overheat: 2, consumption_spike: 1, transformer_issue: 0, grid_instability: 1 },
  { day: 'Sun', solar_fault: 0, battery_overheat: 0, consumption_spike: 3, transformer_issue: 1, grid_instability: 0 },
];

const resolutions = [
  { title: 'Solar Array C — Panel Crack', time: '45 min', resolved: '3 hrs ago' },
  { title: 'Communication Link Drop', time: '12 min', resolved: '5 hrs ago' },
  { title: 'Battery Bank 1 Cooling Alert', time: '28 min', resolved: 'Yesterday' },
];

/* ─── component ─── */
function AnomalyDetection() {
  const healthScore = 87;
  const healthColor = healthScore >= 80 ? '#39ff14' : healthScore >= 60 ? '#ffd700' : '#ff0844';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── active anomalies ── */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-neon-orange" />
            Active Anomalies
            <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-neon-red/15 text-neon-red border border-neon-red/30">
              {anomalies.filter((a) => a.severity === 'Critical').length} critical
            </span>
          </h3>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {anomalies.map((a, i) => {
              const cfg = severityConfig[a.severity];
              const isCritical = a.severity === 'Critical';
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  className={`glass-card p-4 flex gap-4 items-start ${
                    isCritical ? 'animate-pulse-glow border-neon-red/40' : ''
                  }`}
                  style={isCritical ? { borderColor: 'rgba(255,8,68,0.4)' } : undefined}
                >
                  <div className="p-2 rounded-lg shrink-0" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{a.title}</h4>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: cfg.color,
                          background: `${cfg.color}18`,
                          border: `1px solid ${cfg.color}40`,
                        }}
                      >
                        {a.severity}
                      </span>
                      {isCritical && <Volume2 size={14} className="text-neon-red animate-blink" />}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{a.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-text-dim">
                      <span>{a.location}</span>
                      <span>•</span>
                      <span>{a.timestamp}</span>
                    </div>
                  </div>
                  <button className="btn-neon !px-3 !py-1.5 text-xs flex items-center gap-1 shrink-0">
                    <Search size={12} /> Investigate
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── right column ── */}
        <div className="space-y-6">
          {/* health gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex flex-col items-center"
          >
            <span className="text-text-secondary text-sm mb-2">System Health</span>
            <div className="relative w-28 h-28 mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.915"
                  fill="none"
                  stroke={healthColor}
                  strokeWidth="3"
                  strokeDasharray={`${healthScore} ${100 - healthScore}`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color: healthColor }}>
                {healthScore}
              </span>
            </div>
            <span className="text-xs text-text-dim">Score 0–100</span>
          </motion.div>

          {/* resolution log */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-neon-green" /> Recent Resolutions
            </h4>
            <div className="space-y-3">
              {resolutions.map((r, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <Clock size={14} className="text-text-dim mt-0.5 shrink-0" />
                  <div>
                    <p className="text-text-primary font-medium">{r.title}</p>
                    <p className="text-text-dim">
                      Resolved in {r.time} · {r.resolved}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── trend chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-5"
      >
        <h3 className="text-lg font-semibold mb-4">Anomaly Trend — Past 7 Days</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="day" stroke="#8892a4" fontSize={11} />
            <YAxis stroke="#8892a4" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,22,40,0.95)',
                border: '1px solid rgba(0,245,255,0.2)',
                borderRadius: 10,
              }}
            />
            <Bar dataKey="solar_fault" stackId="a" fill="#ffd700" name="Solar Fault" />
            <Bar dataKey="battery_overheat" stackId="a" fill="#ff0844" name="Battery Overheat" />
            <Bar dataKey="consumption_spike" stackId="a" fill="#ff6b35" name="Consumption Spike" />
            <Bar dataKey="transformer_issue" stackId="a" fill="#bf00ff" name="Transformer" />
            <Bar dataKey="grid_instability" stackId="a" fill="#4361ee" name="Grid Instability" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

export default AnomalyDetection;
