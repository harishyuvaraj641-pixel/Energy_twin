import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Zap,
  Leaf,
  Home,
  IndianRupee,
  Globe,
  Brain,
  Settings,
  Activity,
  Shield,
  Users,
  AlertTriangle,
  MonitorDot,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import AnimatedCounter from '../components/AnimatedCounter';

/* ─────────────────────── DATA ─────────────────────── */

const stats = [
  { icon: Zap, value: 12847, suffix: ' MWh', label: 'Clean Energy Generated', color: '#00f5ff' },
  { icon: Leaf, value: 4291, suffix: ' tons', label: 'CO₂ Reduced', color: '#39ff14' },
  { icon: Home, value: 89432, suffix: '', label: 'Homes Powered', color: '#bf00ff' },
  { icon: IndianRupee, value: 2.4, suffix: 'Cr', prefix: '₹', decimals: 1, label: 'Cost Savings', color: '#ffd700' },
];

const features = [
  {
    icon: Globe,
    title: '3D Digital Twin',
    description:
      "Explore a photorealistic CesiumJS-powered replica of your city's entire energy infrastructure in real-time 3D.",
    color: '#00f5ff',
  },
  {
    icon: Brain,
    title: 'AI Forecasting',
    description:
      "NVIDIA NIM-powered neural networks predict energy demand, weather impact, and grid anomalies hours ahead.",
    color: '#bf00ff',
  },
  {
    icon: MonitorDot,
    title: 'Real-time Monitoring',
    description:
      "Live dashboards tracking 10,000+ IoT sensors across solar, wind, grid, and storage assets every second.",
    color: '#39ff14',
  },
  {
    icon: Settings,
    title: 'Smart Optimization',
    description:
      "Automated load balancing and dynamic tariff adjustment maximizes efficiency and minimizes cost.",
    color: '#ff6b35',
  },
  {
    icon: Users,
    title: 'Citizen Portal',
    description:
      "Citizens track personal consumption, earn green rewards, and participate in community energy challenges.",
    color: '#ffd700',
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Response',
    description:
      "Instant anomaly detection, automated failover protocols, and real-time alert broadcasting.",
    color: '#ff0844',
  },
];

const steps = [
  {
    icon: Globe,
    title: 'Monitor',
    description: "Real-time data from 10,000+ IoT sensors across the city's energy grid.",
    color: '#00f5ff',
  },
  {
    icon: Brain,
    title: 'Analyze',
    description: "AI processes patterns, forecasts demand, and detects anomalies in real-time.",
    color: '#bf00ff',
  },
  {
    icon: Settings,
    title: 'Optimize',
    description: "Automated energy distribution, load balancing, and cost optimization.",
    color: '#39ff14',
  },
];

/* ─────────────────────── COMPONENT ─────────────────────── */

const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
  };

  const globeVariants = {
    hidden: { scale: 0, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: 'spring' as const, stiffness: 80, damping: 15 } },
  };

  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    show: { scaleX: 1, opacity: 1, transition: { duration: 1, ease: 'easeOut' as const } },
  };

  return (
    <div className="relative min-h-screen bg-bg-primary overflow-x-hidden">
      <ParticleBackground />

      {/* ════════════ HERO ════════════ */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
      >
        {/* Animated Earth */}
        <motion.div variants={globeVariants} className="relative mb-8">
          <div
            className="w-40 h-40 md:w-56 md:h-56 rounded-full animate-spin-slow"
            style={{
              background:
                'radial-gradient(circle at 35% 35%, #1a6b8a, #0a2f4a 40%, #061a2e 70%, #020d18)',
              boxShadow:
                '0 0 60px rgba(0,245,255,0.25), 0 0 120px rgba(0,245,255,0.1), inset 0 0 40px rgba(0,245,255,0.15)',
            }}
          />
          {/* Atmosphere glow ring */}
          <div
            className="absolute inset-[-12px] rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, transparent 55%, rgba(0,245,255,0.08) 70%, transparent 80%)',
            }}
          />
          {/* Orbit ring */}
          <div
            className="absolute inset-[-30px] rounded-full border border-neon-cyan/10 animate-spin-slow pointer-events-none"
            style={{ animationDuration: '30s' }}
          />
        </motion.div>

        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight gradient-text mb-4 leading-tight">
          AI-Driven Energy Twin
        </motion.h1>

        <motion.p variants={itemVariants} className="neon-text-cyan text-lg md:text-2xl font-medium tracking-widest mb-10">
          Predict &bull; Optimize &bull; Simulate &bull; Sustain
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/login"
            className="btn-neon-solid flex items-center gap-2 text-lg px-8 py-4 rounded-xl cursor-pointer"
          >
            <Sparkles className="w-5 h-5" />
            Launch Platform
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            to="/operator?demo=true"
            className="btn-neon flex items-center gap-2 text-lg px-8 py-4 rounded-xl cursor-pointer"
          >
            <Activity className="w-5 h-5" />
            Live Demo
          </Link>
        </motion.div>

        {/* Energy lines */}
        <motion.div variants={lineVariants} className="absolute bottom-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent origin-center" />
        <motion.div
          variants={lineVariants}
          className="absolute bottom-16 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent origin-center"
          style={{ transitionDelay: '0.2s' }}
        />
      </motion.section>

      {/* ════════════ STATS ════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-16 gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7 }}
        >
          Impact at a Glance
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="glass-card p-6 text-center group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <div
                  className="mx-auto mb-4 w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
                >
                  <Icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: stat.color }}>
                  <AnimatedCounter
                    target={stat.value}
                    prefix={stat.prefix || ''}
                    suffix={stat.suffix}
                    decimals={stat.decimals || 0}
                  />
                </div>
                <p className="text-text-secondary text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-24">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-4 gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          Platform Features
        </motion.h2>
        <motion.p
          className="text-text-secondary text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          A comprehensive AI-powered ecosystem for next-generation urban energy management.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="glass-card p-6 group cursor-default"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div
                  className="mb-4 w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${feature.color}12`, border: `1px solid ${feature.color}25` }}
                >
                  <Icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-24">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-16 gradient-text"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          How It Works
        </motion.h2>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-0">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px bg-gradient-to-r from-[#00f5ff] via-[#bf00ff] to-[#39ff14] opacity-30" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                className="relative flex flex-col items-center text-center z-10 flex-1"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                {/* Step number */}
                <span
                  className="absolute -top-3 -right-2 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: step.color, color: '#0a0e1a' }}
                >
                  {i + 1}
                </span>

                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: `${step.color}12`,
                    border: `1px solid ${step.color}30`,
                    boxShadow: `0 0 25px ${step.color}15`,
                  }}
                >
                  <Icon className="w-9 h-9" style={{ color: step.color }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: step.color }}>
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary max-w-[240px]">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="relative z-10 border-t border-white/5">
        {/* Neon accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col items-center gap-6 text-center">
          <p className="text-lg font-semibold gradient-text">
            Developed by Harish Yuvaraj
          </p>
          <p className="text-sm text-text-secondary">
            Powered by <span className="text-neon-green font-medium">NVIDIA NIM AI</span>
          </p>
          <p className="text-xs text-text-dim max-w-lg">
            Built with React, CesiumJS, Supabase, Node.js, Three.js, and AI
          </p>

          <div className="flex gap-5 mt-2">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-neon-cyan transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-neon-cyan transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-neon-cyan transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
            </a>
          </div>

          <p className="text-[11px] text-text-dim mt-4">
            © {new Date().getFullYear()} AI-Driven Energy Twin. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
