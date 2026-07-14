import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  Sun,
  IndianRupee,
  Calendar,
  Leaf,
  Zap,
  TrendingUp,
  ArrowRight,
  Gauge,
} from 'lucide-react';
import Interactive3DHouse from './Interactive3DHouse';
import { useCitizen } from '../../contexts/CitizenContext';

const SOLAR_IRRADIANCE = 5.5; // kWh/m²/day for Chennai
const PANEL_EFFICIENCY = 0.18;
const SYSTEM_LOSSES = 0.8;
const COST_PER_KW = 55000; // ₹ per kW installed
const ELECTRICITY_RATE = 6.5; // ₹ per unit average
const ANNUAL_DEGRADATION = 0.005;
const CO2_PER_KWH = 0.82; // kg CO₂ per kWh from grid

const orientationFactors: Record<string, number> = {
  South: 1.0,
  East: 0.85,
  West: 0.85,
  North: 0.65,
};

function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}

export default function SolarEstimator() {
  const citizen = useCitizen();
  const {
    roofArea,
    setRoofArea,
    selectedFace: orientation,
    setSelectedFace: setOrientation,
    baselineBill: monthlyBill,
    setBaselineBill: setMonthlyBill,
    budget,
    setBudget,
  } = citizen;

  const calculations = useMemo(() => {
    const oriFactor = orientationFactors[orientation] || 1;
    const usableArea = roofArea * 0.6; // 60% usable
    const panelCapacityKW = (usableArea * PANEL_EFFICIENCY * SOLAR_IRRADIANCE * oriFactor) / 5;
    const systemSize = Math.min(panelCapacityKW, budget / COST_PER_KW);
    const roundedSize = parseFloat(systemSize.toFixed(1));

    const dailyGeneration = roundedSize * SOLAR_IRRADIANCE * SYSTEM_LOSSES * oriFactor;
    const monthlyGeneration = dailyGeneration * 30;
    const monthlySavings = Math.min(monthlyGeneration * ELECTRICITY_RATE, monthlyBill * 0.9);
    const installCost = roundedSize * COST_PER_KW;
    const paybackYears = installCost / (monthlySavings * 12);
    const co2Offset = (monthlyGeneration * 12 * CO2_PER_KWH) / 1000;

    // 25-year projection
    const roiData = [];
    let cumulativeSavings = 0;
    for (let year = 0; year <= 25; year++) {
      const degradedSavings = monthlySavings * 12 * Math.pow(1 - ANNUAL_DEGRADATION, year);
      cumulativeSavings += year === 0 ? 0 : degradedSavings;
      roiData.push({
        year: `Y${year}`,
        savings: Math.round(cumulativeSavings),
        investment: Math.round(installCost),
      });
    }

    const totalSavings25 = cumulativeSavings;

    return {
      systemSize: roundedSize,
      monthlySavings: Math.round(monthlySavings),
      paybackYears: parseFloat(paybackYears.toFixed(1)),
      totalSavings25: Math.round(totalSavings25),
      co2Offset: parseFloat(co2Offset.toFixed(1)),
      installCost: Math.round(installCost),
      monthlyGeneration: Math.round(monthlyGeneration),
      roiData,
    };
  }, [roofArea, orientation, monthlyBill, budget]);

  const resultCards = [
    {
      label: 'System Size',
      value: `${calculations.systemSize} kW`,
      icon: Zap,
      color: '#00f5ff',
    },
    {
      label: 'Monthly Savings',
      value: formatINR(calculations.monthlySavings),
      icon: IndianRupee,
      color: '#39ff14',
    },
    {
      label: 'Payback Period',
      value: `${calculations.paybackYears} yrs`,
      icon: Calendar,
      color: '#ffd700',
    },
    {
      label: '25-Year Savings',
      value: formatINR(calculations.totalSavings25),
      icon: TrendingUp,
      color: '#bf00ff',
    },
    {
      label: 'CO₂ Offset',
      value: `${calculations.co2Offset} t/yr`,
      icon: Leaf,
      color: '#39ff14',
    },
    {
      label: 'Installation Cost',
      value: formatINR(calculations.installCost),
      icon: Gauge,
      color: '#ff6b35',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sun className="text-yellow-400" size={24} />
          Rooftop Solar Estimator
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Calculate your potential savings with rooftop solar for Chennai
          (Avg. {SOLAR_IRRADIANCE} kWh/m²/day)
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Sliders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6"
        >
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Your Details
          </h3>

          {/* Roof Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Roof Area</label>
              <span className="text-sm font-bold text-cyan-400">
                {roofArea} m²
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={roofArea}
              onChange={(e) => setRoofArea(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00f5ff ${((roofArea - 50) / 450) * 100}%, rgba(255,255,255,0.1) ${((roofArea - 50) / 450) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>50 m²</span>
              <span>500 m²</span>
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-sm text-gray-300 block mb-2">
              Roof Orientation
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(orientationFactors).map((dir) => (
                <button
                  key={dir}
                  onClick={() => setOrientation(dir as any)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                    orientation === dir
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Bill */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Monthly Bill</label>
              <span className="text-sm font-bold text-green-400">
                ₹{monthlyBill.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #39ff14 ${((monthlyBill - 500) / 49500) * 100}%, rgba(255,255,255,0.1) ${((monthlyBill - 500) / 49500) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>₹500</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Budget</label>
              <span className="text-sm font-bold text-purple-400">
                {formatINR(budget)}
              </span>
            </div>
            <input
              type="range"
              min={100000}
              max={2000000}
              step={50000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #bf00ff ${((budget - 100000) / 1900000) * 100}%, rgba(255,255,255,0.1) ${((budget - 100000) / 1900000) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>₹1L</span>
              <span>₹20L</span>
            </div>
          </div>

          {/* Monthly Generation */}
          <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4">
            <p className="text-xs text-cyan-300 mb-1">Est. Monthly Generation</p>
            <p className="text-2xl font-bold text-cyan-400">
              {calculations.monthlyGeneration} kWh
            </p>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          {/* Result Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resultCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
                <motion.p
                  key={card.value}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-bold text-white"
                >
                  {card.value}
                </motion.p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
                  {card.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* ROI Projection Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-green-400" />
                ROI Projection
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-green-400 rounded-full" />
                  <span className="text-gray-400">Cumulative Savings</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-red-400 rounded-full" />
                  <span className="text-gray-400">Investment</span>
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculations.roiData}>
                  <defs>
                    <linearGradient id="savingsArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#39ff14" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="year"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    interval={4}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    tickFormatter={(v) => formatINR(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#141b2d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      formatINR(value),
                      name === 'savings' ? 'Cumulative Savings' : 'Investment',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#39ff14"
                    strokeWidth={2}
                    fill="url(#savingsArea)"
                    name="savings"
                  />
                  <Line
                    type="monotone"
                    dataKey="investment"
                    stroke="#ff0844"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={false}
                    name="investment"
                  />
                  <ReferenceLine
                    y={calculations.installCost}
                    stroke="#ff084480"
                    strokeDasharray="4 4"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
              <span className="text-gray-400">Break-even at</span>
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 font-bold text-xs">
                Year {Math.ceil(calculations.paybackYears)}
              </span>
              <ArrowRight size={14} className="text-gray-500" />
              <span className="text-gray-400">then pure profit</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* 3D Microgrid Simulation Twin */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sun className="text-cyan-400" size={18} />
            3D House Microgrid Twin
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            Analyze orientation efficiency in real-time. Drag or click different sloped roof panels to place your solar array, adjust the daylight clock to orbit the Sun, and toggle active loads to observe self-consumption ROI payback.
          </p>
        </div>
        <Interactive3DHouse />
      </motion.div>
    </div>
  );
}
