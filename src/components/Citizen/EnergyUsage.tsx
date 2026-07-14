import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Flame,
  Lightbulb,
  Monitor,
  Wind,
  ChefHat,
} from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';
import { useCitizen } from '../../contexts/CitizenContext';

type ViewMode = 'daily' | 'weekly' | 'monthly';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = eased * value;
      setDisplay(parseFloat(start.toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141b2d] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value} kWh
        </p>
      ))}
    </div>
  );
};

export default function EnergyUsage() {
  const [view, setView] = useState<ViewMode>('daily');
  const citizen = useCitizen();
  const {
    dailyData,
    weeklyData,
    monthlyData,
    comparisonData,
    applianceData: contextApplianceData,
    totalDemand,
    hvacEnabled,
    evEnabled,
  } = citizen;

  const chartData = useMemo(() => {
    if (view === 'daily') return dailyData;
    if (view === 'weekly') return weeklyData;
    return monthlyData;
  }, [view, dailyData, weeklyData, monthlyData]);

  const xKey = view === 'daily' ? 'date' : view === 'weekly' ? 'week' : 'month';

  const currentMonthUsage = Math.round(dailyData.reduce((acc, d) => acc + d.usage, 0));
  const dailyAverage = Math.round(totalDemand * 24 * 10) / 10;
  
  const peakTime = hvacEnabled 
    ? '12:00 PM - 4:00 PM' 
    : evEnabled 
      ? '10:00 PM - 2:00 AM' 
      : '6:00 PM - 9:00 PM';

  const hvacPerc = contextApplianceData.find(a => a.name === 'AC / Cooling')?.value || 0;
  const hvacSub = hvacPerc > 0 
    ? `AC contributes ${hvacPerc}% of peak load` 
    : 'No cooling active';

  const iconMap: Record<string, any> = {
    'AC / Cooling': Wind,
    'Kitchen': ChefHat,
    'Lighting': Lightbulb,
    'EV Charger': Zap,
    'Electronics & Others': Monitor,
    'Others': Flame
  };

  const applianceData = contextApplianceData.map(a => ({
    ...a,
    icon: iconMap[a.name] || Flame
  }));

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Current Month Usage
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-cyan-400">
              <AnimatedCounter value={currentMonthUsage} suffix=" kWh" />
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
            <TrendingDown size={14} />
            <span>12% less than last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Peak Usage Time
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={20} className="text-orange-400" />
            <span className="text-xl font-bold text-orange-400">{peakTime}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {hvacSub}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Daily Average
          </p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-green-400">
              <AnimatedCounter value={dailyAverage} suffix=" kWh" />
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
            <TrendingDown size={14} />
            <span>Within your daily goal</span>
          </div>
        </motion.div>
      </div>

      {/* Area Chart with View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap size={18} className="text-cyan-400" />
            Energy Consumption
          </h3>
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  view === v
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData as any}>
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39ff14" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval={view === 'daily' ? 4 : 0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
              />
              <Area
                type="monotone"
                dataKey="usage"
                name="Grid Usage"
                stroke="#00f5ff"
                strokeWidth={2}
                fill="url(#usageGrad)"
              />
              <Area
                type="monotone"
                dataKey="solar"
                name="Solar"
                stroke="#39ff14"
                strokeWidth={2}
                fill="url(#solarGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Two Column: Comparison + Appliance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            You vs Neighborhood Average
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="you"
                  name="Your Usage"
                  fill="#00f5ff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="neighborhood"
                  name="Avg Neighborhood"
                  fill="#bf00ff80"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Appliance Breakdown Pie */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Usage by Appliance
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={applianceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {applianceData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#141b2d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {applianceData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">{item.name}</span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: item.color }}
                      >
                        {item.value}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
