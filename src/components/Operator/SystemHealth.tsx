import React from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const SYSTEM_COMPONENTS = [
  { name: 'Solar Array A (North)', status: 'online', uptime: 99.8, load: '72%' },
  { name: 'Solar Array B (West)', status: 'online', uptime: 99.5, load: '68%' },
  { name: 'Solar Array C (East)', status: 'warning', uptime: 94.2, load: '45%' }, // inverter issue
  { name: 'Wind Farm North', status: 'online', uptime: 98.9, load: '58%' },
  { name: 'Wind Farm South', status: 'online', uptime: 99.1, load: '62%' },
  { name: 'Battery Bank 1 (Guindy)', status: 'online', uptime: 99.9, load: '78%' },
  { name: 'Battery Bank 2 (Adyar)', status: 'online', uptime: 99.7, load: '92%' },
  { name: 'Battery Bank 3 (OMR)', status: 'online', uptime: 99.8, load: '85%' },
  { name: 'Grid Interconnect Node', status: 'online', uptime: 100.0, load: '1,100 kW' },
  { name: 'Substation - Tondiarpet', status: 'online', uptime: 99.9, load: 'Normal' },
  { name: 'Substation - Tambaram', status: 'online', uptime: 99.8, load: 'Normal' },
  { name: 'NIM Chat Service', status: 'online', uptime: 99.95, load: '0.12s latency' },
];

const EFFICIENCY_DATA = [
  { day: 'Mon', efficiency: 94.2 },
  { day: 'Tue', efficiency: 95.8 },
  { day: 'Wed', efficiency: 93.9 },
  { day: 'Thu', efficiency: 96.1 },
  { day: 'Fri', efficiency: 95.0 },
  { day: 'Sat', efficiency: 97.2 },
  { day: 'Sun', efficiency: 96.8 },
];

const SystemHealth: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">Overall System Uptime</h4>
            <CheckCircle className="w-5 h-5 text-neon-green" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">99.82%</p>
          <p className="text-xs text-text-secondary">Across all 12 operational subsystems</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">Active Warnings</h4>
            <ShieldAlert className="w-5 h-5 text-neon-orange" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">1</p>
          <p className="text-xs text-neon-orange">Inverter mismatch detected on Solar Array C</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">Average API Latency</h4>
            <Activity className="w-5 h-5 text-neon-cyan animate-pulse" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">118 ms</p>
          <p className="text-xs text-text-secondary">NVIDIA NIM & Supabase query latency</p>
        </motion.div>
      </div>

      {/* Main Grid: Components and Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Components Grid */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <h3 className="text-base font-bold text-white mb-4">Operational Status Grid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SYSTEM_COMPONENTS.map((comp, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`status-dot ${comp.status === 'online' ? 'online' : 'warning'}`}></span>
                  <span className="font-semibold text-white">{comp.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{comp.uptime}% Uptime</p>
                  <p className="text-[10px] text-text-secondary">Load: {comp.load}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right side: Performance Chart and Maintenance */}
        <div className="space-y-6">
          {/* Performance Area Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-base font-bold text-white mb-4">Grid Control Efficiency</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EFFICIENCY_DATA}>
                  <defs>
                    <linearGradient id="effGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" />
                  <YAxis domain={[90, 100]} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Efficiency']}
                    contentStyle={{ background: '#141b2d', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px' }}
                  />
                  <Area type="monotone" dataKey="efficiency" stroke="#00f5ff" fill="url(#effGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Maintenance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-neon-purple" />
              Planned Maintenance
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-white">Solar Array C Clean</span>
                  <span className="text-neon-cyan">Jul 05</span>
                </div>
                <p className="text-[10px] text-text-secondary">Expected downtime: 2 hours. Off-peak solar window.</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex justify-between font-semibold mb-1">
                  <span className="text-white">Battery Firmware Upgrade</span>
                  <span className="text-neon-cyan">Jul 12</span>
                </div>
                <p className="text-[10px] text-text-secondary">Guindy Battery Hub firmware patching. Overnight execution.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
