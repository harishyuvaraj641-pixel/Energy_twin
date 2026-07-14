import React from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Receipt, AlertCircle, TrendingDown, HelpCircle } from 'lucide-react';
import AnimatedCounter from '../AnimatedCounter';
import { useSimulation } from '../../contexts/SimulationContext';

import { useCitizen } from '../../contexts/CitizenContext';

const BillEstimator: React.FC = () => {
  const citizen = useCitizen();
  const {
    monthlyBill: projectedBill,
    baselineBill,
    dailyData,
    monthlyData,
    ratePerKWh
  } = citizen;

  const currentUsage = Math.round(dailyData.reduce((acc, d) => acc + d.usage, 0));
  const totalSavings = Math.max(0, baselineBill - projectedBill);

  const BILL_HISTORY = monthlyData.slice(0, 6).map((m, idx) => {
    // July/August represents post-solar drop
    const isPostSolar = idx >= 4;
    const amount = isPostSolar 
      ? Math.round(Math.max(0, m.usage * ratePerKWh - m.solar * ratePerKWh))
      : Math.round(m.usage * ratePerKWh);
    return {
      month: m.month,
      amount,
      usage: m.usage
    };
  });

  return (
    <div className="space-y-6">
      {/* Top metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">Projected Month Bill</h4>
            <Receipt className="w-5 h-5 text-neon-gold" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ₹<AnimatedCounter target={projectedBill} />
          </p>
          <p className="text-xs text-text-secondary">Based on current cycle of {currentUsage} units</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">Savings from Solar/EV</h4>
            <TrendingDown className="w-5 h-5 text-neon-green" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ₹<AnimatedCounter target={totalSavings} />
          </p>
          <p className="text-xs text-neon-green font-semibold">Saved ~34% compared to standard grid</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-text-secondary">EB Slab Rate Status</h4>
            <AlertCircle className="w-5 h-5 text-neon-orange" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">Slab 4</p>
          <p className="text-xs text-neon-orange">High tier (500+ units). Keep below 500 next cycle.</p>
        </motion.div>
      </div>

      {/* Main Grid: Chart and Tariff Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill History Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-white mb-4">6-Month Bill History</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BILL_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [`₹${value}`, 'Amount']}
                  contentStyle={{ background: '#141b2d', border: '1px solid rgba(0, 245, 255, 0.2)', borderRadius: '10px' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {BILL_HISTORY.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === BILL_HISTORY.length - 1 ? '#00f5ff' : '#4361ee'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tariff Slab Table */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            Tariff Breakdown (TNEB Slabs)
            <HelpCircle className="w-4 h-4 text-text-secondary cursor-pointer" />
          </h3>
          <div className="space-y-4">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-text-secondary">
                  <th className="pb-2 font-semibold">Consumption Slab</th>
                  <th className="pb-2 font-semibold text-right">Rate / Unit</th>
                  <th className="pb-2 font-semibold text-right">Your Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-text-primary">
                <tr>
                  <td className="py-2.5">Slab 1 (0 - 100 units)</td>
                  <td className="py-2.5 text-right text-neon-green">₹0.00</td>
                  <td className="py-2.5 text-right">100</td>
                </tr>
                <tr>
                  <td className="py-2.5">Slab 2 (101 - 200 units)</td>
                  <td className="py-2.5 text-right">₹1.50</td>
                  <td className="py-2.5 text-right">100</td>
                </tr>
                <tr>
                  <td className="py-2.5">Slab 3 (201 - 500 units)</td>
                  <td className="py-2.5 text-right">₹2.00</td>
                  <td className="py-2.5 text-right">300</td>
                </tr>
                <tr className="text-neon-orange">
                  <td className="py-2.5 font-semibold">Slab 4 (501+ units)</td>
                  <td className="py-2.5 text-right font-semibold">₹3.50</td>
                  <td className="py-2.5 text-right font-semibold">20</td>
                </tr>
              </tbody>
            </table>
            <div className="p-3 bg-neon-orange/5 border border-neon-orange/10 rounded-xl text-[11px] text-neon-orange flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>You have crossed into Slab 4 this month. An extra surcharge of ₹150 has been applied. Maintain consumption below 500 units next month to drop down to Slab 3.</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Next Month Forecast & Savings Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-white mb-3">Estimated Next Month Bill</h3>
          <p className="text-xs text-text-secondary mb-4">Predicted by AI Twin based on weather patterns and your consumption history.</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-neon-cyan">₹3,450</span>
            <span className="text-xs text-neon-green font-semibold">(-18% projection)</span>
          </div>
          <p className="text-[11px] text-text-secondary mt-2">Projection assumes cooling demand will drop as rain cooling starts next week.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-base font-bold text-white mb-3">Actionable Savings Tips</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-text-secondary">Charge EV after 10:00 PM (Off-Peak)</span>
              <span className="text-neon-green font-semibold">-₹450 / month</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-text-secondary">Set AC thermostat to 25°C instead of 22°C</span>
              <span className="text-neon-green font-semibold">-₹300 / month</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-text-secondary">Run dishwasher/washing machine after 10:00 PM</span>
              <span className="text-neon-green font-semibold">-₹180 / month</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Unplug standby entertainment devices at night</span>
              <span className="text-neon-green font-semibold">-₹120 / month</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BillEstimator;
