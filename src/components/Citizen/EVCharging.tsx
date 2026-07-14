import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Car,
  Zap,
  Clock,
  MapPin,
  Battery,
  IndianRupee,
  TrendingDown,
  Plug,
  Navigation,
  ChevronRight,
} from 'lucide-react';

import { useCitizen } from '../../contexts/CitizenContext';

// Hourly pricing data (24 hours)
const hourlyPricing = Array.from({ length: 24 }, (_, i) => {
  let price: number;
  let category: string;
  if (i >= 22 || i < 5) {
    price = 4.5 + Math.random() * 0.5;
    category = 'super-off-peak';
  } else if ((i >= 5 && i < 8) || (i >= 20 && i < 22)) {
    price = 6.5 + Math.random() * 0.5;
    category = 'off-peak';
  } else {
    price = 8.5 + Math.random() * 1.5;
    category = 'peak';
  }
  return {
    hour: `${i.toString().padStart(2, '0')}:00`,
    price: parseFloat(price.toFixed(2)),
    category,
  };
});

const categoryColors: Record<string, string> = {
  peak: '#ff0844',
  'off-peak': '#ffd700',
  'super-off-peak': '#39ff14',
};

const categoryLabels: Record<string, string> = {
  peak: 'Peak',
  'off-peak': 'Off-Peak',
  'super-off-peak': 'Super Off-Peak',
};

const getCurrentPriceCategory = (hour: number = new Date().getHours()) => {
  if (hour >= 22 || hour < 5) return 'super-off-peak';
  if ((hour >= 5 && hour < 8) || (hour >= 20 && hour < 22)) return 'off-peak';
  return 'peak';
};

const nearbyStations = [
  {
    name: 'Tata Power EZ Charge - T. Nagar',
    distance: '1.2 km',
    available: 3,
    total: 5,
    speed: 60,
    price: 12.5,
    type: 'DC Fast',
  },
  {
    name: 'EESL ChargeGrid - Anna Nagar',
    distance: '2.8 km',
    available: 1,
    total: 4,
    speed: 30,
    price: 10.0,
    type: 'DC',
  },
  {
    name: 'Ather Grid - Adyar',
    distance: '3.5 km',
    available: 4,
    total: 6,
    speed: 15,
    price: 8.5,
    type: 'AC Slow',
  },
  {
    name: 'Statiq - OMR Perungudi',
    distance: '5.1 km',
    available: 2,
    total: 8,
    speed: 120,
    price: 15.0,
    type: 'DC Superfast',
  },
  {
    name: 'ChargeZone - Guindy',
    distance: '6.4 km',
    available: 5,
    total: 6,
    speed: 50,
    price: 11.0,
    type: 'DC Fast',
  },
];

export default function EVCharging() {
  const { timeOfDay } = useCitizen();
  const [batteryCapacity, setBatteryCapacity] = useState(40);
  
  const currentHour = Math.floor(timeOfDay);
  const currentCategory = getCurrentPriceCategory(currentHour);
  const currentPrice = hourlyPricing[currentHour]?.price || 8.5;

  const optimalPrice = useMemo(
    () => Math.min(...hourlyPricing.map((h) => h.price)),
    []
  );

  const costAtCurrent = (batteryCapacity * currentPrice).toFixed(0);
  const costAtOptimal = (batteryCapacity * optimalPrice).toFixed(0);
  const savings = (batteryCapacity * (currentPrice - optimalPrice)).toFixed(0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car className="text-green-400" size={24} />
          EV Charging Intelligence
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Smart charging recommendations based on real-time electricity pricing
        </p>
      </motion.div>

      {/* Price Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Current Rate
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">
              ₹{currentPrice}
            </span>
            <span className="text-sm text-gray-400 mb-1">/kWh</span>
          </div>
          <span
            className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold"
            style={{
              backgroundColor: `${categoryColors[currentCategory]}20`,
              color: categoryColors[currentCategory],
            }}
          >
            {categoryLabels[currentCategory]}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Best Rate Today
            </span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-green-400">
              ₹{optimalPrice}
            </span>
            <span className="text-sm text-gray-400 mb-1">/kWh</span>
          </div>
          <span className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold bg-green-500/20 text-green-400">
            10 PM – 5 AM
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-cyan-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Recommended Time
            </span>
          </div>
          <span className="text-2xl font-bold text-cyan-400 block">
            11 PM – 4 AM
          </span>
          <p className="text-xs text-gray-500 mt-2">
            Save up to 55% vs peak pricing
          </p>
        </motion.div>
      </div>

      {/* Hourly Price Chart + Cost Estimator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Pricing Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            <IndianRupee size={16} className="text-yellow-400" />
            Price by Hour
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Electricity tariff throughout the day
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPricing}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 9 }}
                  interval={2}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#141b2d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`₹${value}/kWh`, 'Price']}
                />
                <Bar dataKey="price" radius={[3, 3, 0, 0]} maxBarSize={20}>
                  {hourlyPricing.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={categoryColors[entry.category]}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <span key={key} className="flex items-center gap-2 text-xs text-gray-400">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: categoryColors[key] }}
                />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Cost Estimator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Battery size={16} className="text-cyan-400" />
            Charging Cost
          </h3>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-gray-300">Battery Capacity</label>
              <span className="text-sm font-bold text-cyan-400">
                {batteryCapacity} kWh
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={batteryCapacity}
              onChange={(e) => setBatteryCapacity(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00f5ff ${((batteryCapacity - 20) / 80) * 100}%, rgba(255,255,255,0.1) ${((batteryCapacity - 20) / 80) * 100}%)`,
              }}
            />
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-xs text-red-300 mb-1">Cost Now (Current Rate)</p>
              <p className="text-2xl font-bold text-red-400">₹{costAtCurrent}</p>
            </div>
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-xs text-green-300 mb-1">Cost at Optimal Time</p>
              <p className="text-2xl font-bold text-green-400">₹{costAtOptimal}</p>
            </div>
            <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4">
              <p className="text-xs text-cyan-300 mb-1">You Save</p>
              <p className="text-2xl font-bold text-cyan-400">₹{savings}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Nearby Stations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-cyan-400" />
          Nearby Charging Stations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyStations.map((station, i) => (
            <motion.div
              key={station.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {station.name}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <Navigation size={10} />
                    <span>{station.distance}</span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="text-center rounded-lg bg-white/5 py-2">
                  <p className="text-xs text-gray-400">Available</p>
                  <p className="text-sm font-bold">
                    <span
                      className={
                        station.available > 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {station.available}
                    </span>
                    <span className="text-gray-500">/{station.total}</span>
                  </p>
                </div>
                <div className="text-center rounded-lg bg-white/5 py-2">
                  <p className="text-xs text-gray-400">Speed</p>
                  <p className="text-sm font-bold text-cyan-400">
                    {station.speed} kW
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-medium">
                  {station.type}
                </span>
                <span className="text-sm font-bold text-yellow-400">
                  ₹{station.price}/kWh
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
