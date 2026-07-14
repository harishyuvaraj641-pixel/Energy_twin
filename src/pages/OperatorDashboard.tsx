import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSimulation } from '../contexts/SimulationContext';
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  SlidersHorizontal,
  Brain,
  AlertTriangle,
  ShieldAlert,
  Activity,
  FileText,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Menu,
  ChevronLeft,
  Clock,
} from 'lucide-react';

import EnergyOverview from '../components/Operator/EnergyOverview';
import CityMap from '../components/CityMap/CityMap';
import ForecastPanel from '../components/Operator/ForecastPanel';
import WhatIfSimulator from '../components/Operator/WhatIfSimulator';
import AIOptimization from '../components/Operator/AIOptimization';
import AnomalyDetection from '../components/Operator/AnomalyDetection';
import EmergencyMode from '../components/Operator/EmergencyMode';
import SystemHealth from '../components/Operator/SystemHealth';
import ReportGenerator from '../components/Operator/ReportGenerator';
import DemoController from '../components/DemoMode/DemoController';
import ChatWidget from '../components/AIChatbot/ChatWidget';

const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { currentData } = useSimulation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('command-center');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  // Check if query params have demo=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('demo') === 'true') {
      setShowDemo(true);
    }
  }, [location]);

  // Support programmatic tab switching from voice chatbot commands
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.tab) {
        setActiveTab(detail.tab);
      }
    };
    window.addEventListener('change-operator-tab', handleTabChange);
    return () => window.removeEventListener('change-operator-tab', handleTabChange);
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setTimeStr(date.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'energy-map', label: 'Live Energy Map', icon: Map },
    { id: 'forecasting', label: 'AI Forecasting', icon: TrendingUp },
    { id: 'what-if', label: 'What-If Simulator', icon: SlidersHorizontal },
    { id: 'optimization', label: 'AI Optimization', icon: Brain },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'emergency', label: 'Emergency Mode', icon: ShieldAlert },
    { id: 'health', label: 'System Health', icon: Activity },
    { id: 'reports', label: 'Report Generator', icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getSystemStatus = () => {
    if (activeTab === 'emergency') {
      return { label: 'EMERGENCY MODE ACTIVE', color: 'critical' };
    }
    return { label: 'All Systems Normal', color: 'online' };
  };

  const status = getSystemStatus();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        className="flex flex-col bg-bg-secondary border-r border-white/5 h-full relative"
      >
        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center cursor-pointer text-neon-cyan z-20 hover:bg-neon-cyan/20"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-bg-primary stroke-[3]" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-extrabold text-sm tracking-wider gradient-text">
              ENERGY TWIN
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-xs font-bold text-neon-cyan flex-shrink-0">
            {user?.name ? user.name[0] : 'O'}
          </div>
          {!sidebarCollapsed && (
            <div>
              <p className="text-xs font-bold text-white truncate max-w-[150px]">{user?.name || 'Operator Hub'}</p>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-neon-cyan">City Operator</p>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,245,255,0.05)]'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-neon-cyan' : ''}`} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-text-secondary hover:text-neon-red hover:bg-neon-red/5 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-bg-secondary/40 backdrop-blur">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2">
              <span className={`status-dot ${status.color}`}></span>
              <span className="text-xs text-text-secondary font-semibold">{status.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Timer */}
            <div className="flex items-center gap-2 text-xs font-semibold font-mono text-neon-cyan">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{timeStr} IST</span>
            </div>

            {/* Notification Bell */}
            <button className="relative w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-text-secondary hover:text-white cursor-pointer transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_#ff0844]"></span>
            </button>
          </div>
        </header>

        {/* Alert Ticker */}
        <div className="h-7 bg-black/40 border-b border-white/5 flex items-center text-[10px] text-neon-orange font-semibold px-8 overflow-hidden select-none">
          <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-3 flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
            <span>ALERTS:</span>
          </div>
          {React.createElement(
            'marquee',
            { className: 'w-full' },
            <>
              <span>[WARNING] Solar Array C experiencing 15% generation loss due to inverter discrepancy at Chennai East Hub</span>
              <span className="mx-8">|</span>
              <span>[INFO] Battery Hub Adyar fully charged (92%) and ready for peak evening shaving cycle</span>
              <span className="mx-8">|</span>
              <span>[SUGGESTION] Delay residential EV fast charging cycle until 22:00 to avoid ₹6.50/kWh peak tariff index</span>
            </>
          )}
        </div>

        {/* Dynamic Panels */}
        <main className="flex-1 overflow-y-auto p-8 bg-bg-primary/50 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              {activeTab === 'command-center' && <EnergyOverview />}
              {activeTab === 'energy-map' && (
                <div className="h-full flex flex-col">
                  <CityMap />
                </div>
              )}
              {activeTab === 'forecasting' && <ForecastPanel />}
              {activeTab === 'what-if' && <WhatIfSimulator />}
              {activeTab === 'optimization' && <AIOptimization />}
              {activeTab === 'anomalies' && <AnomalyDetection />}
              {activeTab === 'emergency' && <EmergencyMode />}
              {activeTab === 'health' && <SystemHealth />}
              {activeTab === 'reports' && <ReportGenerator />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating chatbot widget */}
      <ChatWidget />

      {/* Interactive live demo controller */}
      {showDemo && (
        <DemoController onClose={() => setShowDemo(false)} />
      )}
    </div>
  );
};

export default OperatorDashboard;
