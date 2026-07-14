import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Leaf,
  TreePine,
  CarFront,
  Plane,
  TrendingDown,
  Lightbulb,
  Droplets,
  Thermometer,
  Recycle,
  Sun,
  Gauge,
} from 'lucide-react';
import { useSimulation } from '../../contexts/SimulationContext';
import { useCitizen } from '../../contexts/CitizenContext';

const monthlyCO2 = [
  { month: 'Jul', co2: 168 },
  { month: 'Aug', co2: 175 },
  { month: 'Sep', co2: 160 },
  { month: 'Oct', co2: 142 },
  { month: 'Nov', co2: 130 },
  { month: 'Dec', co2: 125 },
  { month: 'Jan', co2: 118 },
  { month: 'Feb', co2: 112 },
  { month: 'Mar', co2: 108 },
  { month: 'Apr', co2: 115 },
  { month: 'May', co2: 122 },
  { month: 'Jun', co2: 118 },
];

const categoryBreakdown = [
  { name: 'Electricity', value: 52, color: '#00f5ff' },
  { name: 'Transport', value: 28, color: '#ff6b35' },
  { name: 'Gas', value: 12, color: '#ffd700' },
  { name: 'Diet', value: 8, color: '#bf00ff' },
];

const equivalences = [
  {
    icon: TreePine,
    value: 6.2,
    unit: 'trees',
    label: 'Trees Worth Planted',
    color: '#39ff14',
  },
  {
    icon: CarFront,
    value: 1420,
    unit: 'km',
    label: 'KM Not Driven',
    color: '#00f5ff',
  },
  {
    icon: Plane,
    value: 0.8,
    unit: 'flights',
    label: 'Flights Offset',
    color: '#bf00ff',
  },
];

const tips = [
  {
    icon: Thermometer,
    title: 'Set AC to 24°C',
    desc: 'Each degree saves ~6% cooling energy',
    savings: '15 kg/mo',
    color: '#00f5ff',
  },
  {
    icon: Sun,
    title: 'Switch to Solar',
    desc: 'Rooftop solar can offset 80% grid usage',
    savings: '80 kg/mo',
    color: '#ffd700',
  },
  {
    icon: Droplets,
    title: 'Use Cold Wash',
    desc: 'Cold water laundry saves heating energy',
    savings: '8 kg/mo',
    color: '#39ff14',
  },
  {
    icon: Lightbulb,
    title: 'LED Lighting',
    desc: 'Replace all bulbs with LED for 75% savings',
    savings: '12 kg/mo',
    color: '#bf00ff',
  },
  {
    icon: Recycle,
    title: 'Reduce, Reuse',
    desc: 'Compost organic waste to reduce methane',
    savings: '10 kg/mo',
    color: '#ff6b35',
  },
];

function AnimatedGauge({ value, max }: { value: number; max: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = (animatedValue / max) * 100;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  const getColor = () => {
    if (percentage < 40) return '#39ff14';
    if (percentage < 70) return '#ffd700';
    return '#ff0844';
  };

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-[135deg]">
        {/* Background arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{animatedValue}</span>
        <span className="text-sm text-gray-400">kg CO₂</span>
        <span className="text-xs text-gray-500 mt-1">this month</span>
      </div>
    </div>
  );
}

function GreenScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 75) return '#39ff14';
    if (score >= 50) return '#ffd700';
    if (score >= 25) return '#ff6b35';
    return '#ff0844';
  };

  const getLabel = () => {
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="text-center">
      <div className="relative w-20 h-20 mx-auto mb-2">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 42}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100),
            }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: getColor() }}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-xs font-semibold" style={{ color: getColor() }}>
        {getLabel()}
      </p>
    </div>
  );
}

export default function CarbonFootprint() {
  const { currentData } = useSimulation();
  const citizen = useCitizen();
  const {
    dailyData,
    monthlyData,
    applianceData,
  } = citizen;

  // Compute actual monthly values from the dailyData points generated by context
  const monthlyDemand = dailyData.reduce((acc, d) => acc + d.usage, 0);
  const monthlySolar = dailyData.reduce((acc, d) => acc + d.solar, 0);
  const monthlyImport = Math.max(0, monthlyDemand - monthlySolar);
  
  const currentMonthCO2 = Math.round(monthlyImport * 0.82);
  const maxCO2 = 250;
  const cityAverage = 150;

  // Green score represents self-sufficient clean energy fraction
  const greenScore = Math.max(10, Math.min(100, Math.round((monthlySolar / (monthlyDemand || 1)) * 100)));

  // Equivalences scaled dynamically
  const equivalences = [
    {
      icon: TreePine,
      value: parseFloat(((monthlySolar * 0.82 * 12) / 22).toFixed(1)),
      unit: 'trees',
      label: 'Trees Worth Planted',
      color: '#39ff14',
    },
    {
      icon: CarFront,
      value: Math.round((monthlySolar * 0.82) / 0.12),
      unit: 'km',
      label: 'KM Not Driven',
      color: '#00f5ff',
    },
    {
      icon: Plane,
      value: parseFloat(((monthlySolar * 0.82) / 250).toFixed(1)),
      unit: 'flights',
      label: 'Flights Offset',
      color: '#bf00ff',
    },
  ];

  const categoryBreakdown = applianceData.map(a => ({
    name: a.name,
    value: a.value,
    color: a.color,
  }));

  const monthlyCO2 = monthlyData.map(m => ({
    month: m.month,
    co2: Math.round(Math.max(0, m.usage - m.solar) * 0.82),
  }));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Leaf className="text-green-400" size={24} />
          Carbon Footprint Tracker
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Monitor and reduce your environmental impact
        </p>
      </motion.div>

      {/* Top Row: Gauge + Score + Equivalences */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
            Monthly Emissions
          </h3>
          <AnimatedGauge value={currentMonthCO2} max={maxCO2} />
          <div className="flex items-center justify-center gap-2 mt-4">
            <TrendingDown size={14} className="text-green-400" />
            <span className="text-xs text-green-400 font-semibold">
              24% below city average ({cityAverage} kg)
            </span>
          </div>
        </motion.div>

        {/* Green Score + City Comparison */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Green Score
          </h3>
          <GreenScore score={greenScore} />
          <div className="w-full mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">You</span>
              <span className="text-green-400 font-bold">{currentMonthCO2} kg</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentMonthCO2 / maxCO2) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-green-400"
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">City Average</span>
              <span className="text-orange-400 font-bold">{cityAverage} kg</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(cityAverage / maxCO2) * 100}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="h-full rounded-full bg-orange-400"
              />
            </div>
          </div>
        </motion.div>

        {/* Equivalences */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Your Impact Equals
          </h3>
          <div className="space-y-4">
            {equivalences.map((eq, i) => (
              <motion.div
                key={eq.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-4 rounded-xl bg-white/5 p-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${eq.color}15` }}
                >
                  <eq.icon size={22} style={{ color: eq.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">
                    {eq.value}{' '}
                    <span className="text-sm text-gray-400">{eq.unit}</span>
                  </p>
                  <p className="text-xs text-gray-500">{eq.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge size={16} className="text-cyan-400" />
            12-Month CO₂ Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCO2}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00f5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  domain={[80, 200]}
                />
                <Tooltip
                  contentStyle={{
                    background: '#141b2d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} kg CO₂`, 'Emissions']}
                />
                <Line
                  type="monotone"
                  dataKey="co2"
                  stroke="#00f5ff"
                  strokeWidth={2.5}
                  dot={{ fill: '#00f5ff', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#00f5ff', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Emissions by Category
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#141b2d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 flex-1">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{cat.name}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: cat.color }}
                      >
                        {cat.value}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.value}%` }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-400" />
          Tips to Reduce Your Footprint
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {tips.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/8 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${tip.color}15` }}
              >
                <tip.icon size={18} style={{ color: tip.color }} />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {tip.title}
              </h4>
              <p className="text-xs text-gray-400 mb-2">{tip.desc}</p>
              <span
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: `${tip.color}15`,
                  color: tip.color,
                }}
              >
                Save {tip.savings}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
