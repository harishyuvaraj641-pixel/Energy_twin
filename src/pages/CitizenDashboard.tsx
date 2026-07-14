import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  BarChart3,
  Sun,
  Car,
  Leaf,
  Users,
  Bot,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Zap,
  TrendingDown,
  DollarSign,
  ThermometerSun,
  ChevronRight,
  Activity,
  Home,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import EnergyUsage from '../components/Citizen/EnergyUsage';
import SolarEstimator from '../components/Citizen/SolarEstimator';
import EVCharging from '../components/Citizen/EVCharging';
import CarbonFootprint from '../components/Citizen/CarbonFootprint';
import CommunityContribution from '../components/Citizen/CommunityContribution';
import BillEstimator from '../components/Citizen/BillEstimator';
import Immersive3DHouseApp from '../components/Citizen/Immersive3DHouseApp';
import { useSimulation } from '../contexts/SimulationContext';
import { CitizenProvider, useCitizen } from '../contexts/CitizenContext';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'immersive-3d', label: '3D Smart Home', icon: Home },
  { id: 'energy', label: 'Energy Usage', icon: BarChart3 },
  { id: 'solar', label: 'Solar Estimator', icon: Sun },
  { id: 'ev', label: 'EV Charging', icon: Car },
  { id: 'carbon', label: 'Carbon Footprint', icon: Leaf },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'ai', label: 'AI Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const miniSparkline = [
  { v: 32 }, { v: 45 }, { v: 38 }, { v: 52 }, { v: 48 }, { v: 61 }, { v: 55 },
  { v: 42 }, { v: 58 }, { v: 65 }, { v: 50 }, { v: 70 },
];

const weeklyUsage = [
  { day: 'Mon', kWh: 14.2 },
  { day: 'Tue', kWh: 12.8 },
  { day: 'Wed', kWh: 16.1 },
  { day: 'Thu', kWh: 11.5 },
  { day: 'Fri', kWh: 15.3 },
  { day: 'Sat', kWh: 18.7 },
  { day: 'Sun', kWh: 17.2 },
];

const summaryCards = [
  {
    title: 'Today\'s Usage',
    value: '14.2 kWh',
    change: '-8%',
    positive: true,
    icon: Zap,
    color: '#00f5ff',
    sparkData: miniSparkline,
  },
  {
    title: 'Monthly Bill Est.',
    value: '₹2,840',
    change: '-12%',
    positive: true,
    icon: DollarSign,
    color: '#39ff14',
    sparkData: miniSparkline.map((d) => ({ v: d.v * 1.2 })),
  },
  {
    title: 'Carbon Footprint',
    value: '48.5 kg',
    change: '+3%',
    positive: false,
    icon: Leaf,
    color: '#bf00ff',
    sparkData: miniSparkline.map((d) => ({ v: d.v * 0.8 })),
  },
  {
    title: 'Solar Generation',
    value: '6.8 kWh',
    change: '+15%',
    positive: true,
    icon: Sun,
    color: '#ffd700',
    sparkData: miniSparkline.map((d) => ({ v: d.v * 0.6 })),
  },
  {
    title: 'Peak Temp',
    value: '34°C',
    change: '+2°C',
    positive: false,
    icon: ThermometerSun,
    color: '#ff6b35',
    sparkData: miniSparkline.map((d) => ({ v: d.v * 0.5 + 20 })),
  },
  {
    title: 'Savings This Month',
    value: '₹620',
    change: '+24%',
    positive: true,
    icon: TrendingDown,
    color: '#00f5ff',
    sparkData: miniSparkline.map((d) => ({ v: d.v * 1.5 })),
  },
];

function OverviewSection() {
  const { currentData } = useSimulation();
  const { totalDemand, solarOutput, co2Offset, monthlyBill, efficiencyScore, dailyData, baselineBill } = useCitizen();

  const temperature = currentData?.temperature ?? 32;

  const todayUsage = dailyData[dailyData.length - 1]?.usage || (totalDemand * 24);
  const todaySolar = dailyData[dailyData.length - 1]?.solar || (solarOutput * 24);
  const monthSavings = Math.max(0, baselineBill - monthlyBill);

  const dynamicCards = [
    {
      title: "Today's Usage",
      value: `${todayUsage.toFixed(1)} kWh`,
      change: totalDemand > 0 ? '-8%' : '0%',
      positive: true,
      icon: Zap,
      color: '#00f5ff',
      sparkData: miniSparkline,
    },
    {
      title: 'Monthly Bill Est.',
      value: `₹${Math.round(monthlyBill).toLocaleString('en-IN')}`,
      change: monthlyBill > 0 ? '-12%' : '0%',
      positive: true,
      icon: DollarSign,
      color: '#39ff14',
      sparkData: miniSparkline.map((d) => ({ v: d.v * 1.2 })),
    },
    {
      title: 'Carbon Footprint',
      value: `${co2Offset.toFixed(1)} kg`,
      change: co2Offset > 0 ? '-5%' : '0%',
      positive: true,
      icon: Leaf,
      color: '#bf00ff',
      sparkData: miniSparkline.map((d) => ({ v: d.v * 0.8 })),
    },
    {
      title: 'Solar Generation',
      value: `${todaySolar.toFixed(1)} kWh`,
      change: solarOutput > 0 ? `+${efficiencyScore}%` : '0%',
      positive: true,
      icon: Sun,
      color: '#ffd700',
      sparkData: miniSparkline.map((d) => ({ v: d.v * 0.6 })),
    },
    {
      title: 'Peak Temp',
      value: `${Math.round(temperature)}°C`,
      change: '+1°C',
      positive: false,
      icon: ThermometerSun,
      color: '#ff6b35',
      sparkData: miniSparkline.map((d) => ({ v: d.v * 0.5 + 20 })),
    },
    {
      title: 'Savings This Month',
      value: `₹${Math.round(monthSavings).toLocaleString('en-IN')}`,
      change: solarOutput > 0 ? '+24%' : '0%',
      positive: true,
      icon: TrendingDown,
      color: '#00f5ff',
      sparkData: miniSparkline.map((d) => ({ v: d.v * 1.5 })),
    },
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white"
      >
        Welcome back, Dinesh 👋
      </motion.h2>
      <p className="text-gray-400 -mt-4">
        Here&apos;s your energy snapshot for today.
      </p>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dynamicCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:border-white/20 transition-colors group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <card.icon size={20} style={{ color: card.color }} />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.positive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {card.change}
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.sparkData}>
                  <defs>
                    <linearGradient
                      id={`sparkGrad-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={card.color}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={card.color}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={card.color}
                    strokeWidth={2}
                    fill={`url(#sparkGrad-${i})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Usage Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" />
            This Week&apos;s Usage
          </h3>
          <span className="text-xs text-gray-400">kWh per day</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyUsage}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#00f5ff" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#141b2d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="kWh"
                fill="url(#barGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: 'Estimate Solar Savings',
            icon: Sun,
            color: '#ffd700',
            section: 'solar',
          },
          {
            label: 'Find EV Stations',
            icon: Car,
            color: '#39ff14',
            section: 'ev',
          },
          {
            label: 'View Carbon Report',
            icon: Leaf,
            color: '#bf00ff',
            section: 'carbon',
          },
        ].map((action) => (
          <button
            key={action.label}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/10 transition-all group text-left"
          >
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <action.icon size={20} style={{ color: action.color }} />
            </div>
            <span className="text-sm font-medium text-white">
              {action.label}
            </span>
            <ChevronRight
              size={16}
              className="ml-auto text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all"
            />
          </button>
        ))}
      </motion.div>
    </div>
  );
}

function AIAssistantSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center"
    >
      <Bot size={48} className="text-cyan-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">AI Energy Assistant</h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Ask me anything about your energy usage, savings tips, solar
        recommendations, or sustainability goals.
      </p>
      <div className="max-w-lg mx-auto flex gap-2">
        <input
          type="text"
          placeholder="How can I reduce my electricity bill?"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 backdrop-blur"
        />
        <button className="px-6 py-3 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold hover:bg-cyan-500/30 transition-colors border border-cyan-500/30">
          Ask
        </button>
      </div>
    </motion.div>
  );
}

function SettingsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      {[
        'Notification Preferences',
        'Energy Goals',
        'Connected Devices',
        'Account Details',
        'Privacy & Data',
      ].map((item, i) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/10 transition-colors cursor-pointer group"
        >
          <span className="text-white font-medium">{item}</span>
          <ChevronRight
            size={18}
            className="text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all"
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function CitizenDashboardContent() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'immersive-3d':
        return <Immersive3DHouseApp onClose={() => setActiveSection('overview')} />;
      case 'energy':
        return <EnergyUsage />;
      case 'solar':
        return <SolarEstimator />;
      case 'ev':
        return <EVCharging />;
      case 'carbon':
        return <CarbonFootprint />;
      case 'community':
        return <CommunityContribution />;
      case 'ai':
        return <AIAssistantSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0f1628]/95 backdrop-blur-2xl flex flex-col transform lg:transform-none transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Energy Twin
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
              Citizen Portal
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-cyan-400"
                  />
                )}
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-xs font-bold text-white">
              D
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">Dinesh</p>
              <p className="text-[10px] text-gray-500">Chennai, TN</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 bg-[#0f1628]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {navItems.find((n) => n.id === activeSection)?.label}
              </h2>
              <p className="text-[11px] text-gray-500">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell size={18} />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
            </button>
            <button className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function CitizenDashboard() {
  return (
    <CitizenProvider>
      <CitizenDashboardContent />
    </CitizenProvider>
  );
}
