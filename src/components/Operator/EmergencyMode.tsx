import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, ShieldCheck, Power, Zap, Phone,
  CheckCircle2, XCircle, Clock, ArrowRight,
} from 'lucide-react';

/* ─── data ─── */
interface LoadRow {
  name: string;
  status: 'MAINTAINED' | 'REDUCED 50%' | 'SHED';
  color: string;
}

const loadTable: LoadRow[] = [
  { name: 'Hospitals', status: 'MAINTAINED', color: '#39ff14' },
  { name: 'Traffic Lights', status: 'MAINTAINED', color: '#39ff14' },
  { name: 'Emergency Services', status: 'MAINTAINED', color: '#39ff14' },
  { name: 'Street Lights', status: 'REDUCED 50%', color: '#ffd700' },
  { name: 'Commercial Buildings', status: 'SHED', color: '#ff0844' },
  { name: 'EV Chargers', status: 'SHED', color: '#ff0844' },
];

const reroutingSteps = [
  'Isolating affected grid sectors…',
  'Redirecting battery reserves to critical loads…',
  'Activating backup generators…',
  'Balancing load across micro-grids…',
  'Stabilizing voltage levels…',
];

const emergencyContacts = [
  { name: 'Grid Control Room', phone: '+91 44 2345 6789' },
  { name: 'Fire & Rescue', phone: '101' },
  { name: 'Municipal Emergency', phone: '108' },
  { name: 'Site Engineer (On-Call)', phone: '+91 98765 43210' },
];

/* ─── component ─── */
function EmergencyMode() {
  const [isActive, setIsActive] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleToggle = () => {
    if (!isActive) {
      setShowConfirm(true);
    } else {
      setIsActive(false);
      setActiveStep(0);
    }
  };

  const confirmActivate = () => {
    setShowConfirm(false);
    setIsActive(true);
    // animate through rerouting steps
    reroutingSteps.forEach((_, i) => {
      setTimeout(() => setActiveStep(i + 1), 1200 * (i + 1));
    });
  };

  const availablePower = isActive ? 38 : 100;
  const gaugeColor = availablePower > 60 ? '#39ff14' : availablePower > 30 ? '#ffd700' : '#ff0844';

  return (
    <div className="space-y-6">
      {/* ── confirmation dialog ── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="glass-card p-8 max-w-md mx-4 text-center"
            >
              <ShieldAlert size={48} className="text-neon-red mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Activate Emergency Mode?</h2>
              <p className="text-sm text-text-secondary mb-6">
                This will initiate emergency load shedding, cut non-critical systems, and reroute power to essential services.
                This action is logged and audited.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="btn-neon flex items-center gap-2"
                >
                  <XCircle size={16} /> Cancel
                </button>
                <button
                  onClick={confirmActivate}
                  className="btn-danger flex items-center gap-2 !bg-neon-red/20"
                >
                  <Power size={16} /> Confirm Activation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── toggle button ── */}
      <div className="flex flex-col items-center gap-4">
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.95 }}
          className={`relative w-40 h-40 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
            isActive
              ? 'bg-neon-red/20 border-2 border-neon-red text-neon-red animate-pulse-glow'
              : 'glass border-2 border-text-dim text-text-secondary hover:border-neon-red/50 hover:text-neon-red'
          }`}
          style={
            isActive
              ? { boxShadow: '0 0 30px rgba(255,8,68,0.4), 0 0 80px rgba(255,8,68,0.15)' }
              : undefined
          }
        >
          <div className="flex flex-col items-center gap-1">
            <Power size={36} />
            <span className="text-xs">{isActive ? 'DEACTIVATE' : 'ACTIVATE'}</span>
          </div>
        </motion.button>
      </div>

      {/* ── status ── */}
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* emergency banner */}
            <div
              className="glass-card p-4 text-center border-neon-red/40"
              style={{
                borderColor: 'rgba(255,8,68,0.4)',
                boxShadow: '0 0 40px rgba(255,8,68,0.15)',
              }}
            >
              <motion.p
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-xl font-bold text-neon-red"
              >
                ⚠ EMERGENCY MODE ACTIVE ⚠
              </motion.p>
              <p className="text-xs text-text-secondary mt-1">
                Simulated outage — non-critical loads are being shed
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* load shedding table */}
              <div className="glass-card p-5 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-neon-orange" /> Priority Load Shedding
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-text-dim text-xs border-b border-white/5">
                        <th className="text-left py-2 px-3">#</th>
                        <th className="text-left py-2 px-3">System</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadTable.map((row, i) => (
                        <motion.tr
                          key={row.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="border-b border-white/5"
                        >
                          <td className="py-3 px-3 text-text-dim">{i + 1}</td>
                          <td className="py-3 px-3 font-medium">{row.name}</td>
                          <td className="py-3 px-3">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                color: row.color,
                                background: `${row.color}18`,
                                border: `1px solid ${row.color}40`,
                              }}
                            >
                              {row.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* right column */}
              <div className="space-y-5">
                {/* available power gauge */}
                <div className="glass-card p-5 flex flex-col items-center">
                  <span className="text-text-secondary text-sm mb-2">Available Power</span>
                  <div className="relative w-24 h-24 mb-1">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.915"
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="3"
                        strokeDasharray={`${availablePower} ${100 - availablePower}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xl font-bold" style={{ color: gaugeColor }}>
                      {availablePower}%
                    </span>
                  </div>
                  <span className="text-xs text-text-dim">1,520 kW / 4,000 kW</span>
                </div>

                {/* estimated recovery */}
                <div className="glass-card p-4 text-center">
                  <Clock size={20} className="text-neon-cyan mx-auto mb-1" />
                  <p className="text-xs text-text-secondary">Estimated Recovery</p>
                  <p className="text-2xl font-bold text-neon-cyan">~45 min</p>
                </div>
              </div>
            </div>

            {/* AI rerouting steps */}
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-4">AI Power Rerouting</h3>
              <div className="space-y-3">
                {reroutingSteps.map((step, i) => {
                  const done = activeStep > i;
                  const current = activeStep === i + 1;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: done || current ? 1 : 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          done
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                            : current
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 animate-pulse-glow'
                            : 'glass text-text-dim'
                        }`}
                      >
                        {done ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      <ArrowRight size={14} className="text-text-dim shrink-0" />
                      <span className={`text-sm ${done ? 'text-neon-green' : current ? 'text-neon-cyan' : 'text-text-dim'}`}>
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* emergency contacts */}
            <div className="glass-card p-5">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Phone size={18} className="text-neon-cyan" /> Emergency Contacts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {emergencyContacts.map((c) => (
                  <div key={c.name} className="glass rounded-lg p-3 flex items-center gap-3">
                    <Phone size={16} className="text-neon-cyan shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-neon-cyan font-mono">{c.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-8 text-center"
          >
            <ShieldCheck size={48} className="text-neon-green mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-neon-green mb-1">System Normal</h2>
            <p className="text-sm text-text-secondary">
              All systems are operating within normal parameters. Emergency mode is on standby.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default EmergencyMode;
