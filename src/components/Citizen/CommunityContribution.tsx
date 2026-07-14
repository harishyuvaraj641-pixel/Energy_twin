import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Sun,
  Trophy,
  Medal,
  Award,
  Star,
  Zap,
  Target,
  ChevronUp,
  Crown,
  Shield,
  Leaf,
} from 'lucide-react';

import { useCitizen } from '../../contexts/CitizenContext';

// Community configs

const monthlyChallenge = {
  title: 'July Solar Sprint 🌞',
  description: 'Community goal: Generate 50,000 kWh from rooftop solar this month',
  target: 50000,
  current: 34200,
  daysLeft: 29,
  participants: 847,
  yourContribution: 534,
};

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display.toLocaleString('en-IN')}</>;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={16} className="text-yellow-400" />;
  if (rank === 2) return <Medal size={16} className="text-gray-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="text-xs text-gray-500 font-bold w-4 text-center">{rank}</span>;
}

function getRankBg(rank: number) {
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20';
  if (rank === 2) return 'bg-gray-400/10 border-gray-400/20';
  if (rank === 3) return 'bg-amber-600/10 border-amber-600/20';
  return 'bg-white/5 border-white/10';
}

export default function CommunityContribution() {
  const citizen = useCitizen();
  const { dailyData } = citizen;

  // Compute your actual solar contribution from the context
  const yourContribution = Math.round(dailyData.reduce((acc, d) => acc + d.solar, 0));
  const totalProduction = 342000 + yourContribution; // baseline community + your actual solar
  const yourPercentage = ((yourContribution / totalProduction) * 100).toFixed(3);
  const challengeProgress = ((34200 + yourContribution) / monthlyChallenge.target) * 100;

  // Dynamically recalculate leaderboard ranking
  const initialLeaderboard = [
    { name: 'Priya Sharma', contribution: 842, badges: ['Solar Pioneer', 'Green Champion'] },
    { name: 'Rajesh Kumar', contribution: 756, badges: ['Solar Pioneer', 'Energy Saver'] },
    { name: 'Anita Desai', contribution: 698, badges: ['Green Champion'] },
    { name: 'Vikram Singh', contribution: 645, badges: ['Energy Saver', 'Community Leader'] },
    { name: 'Meera Patel', contribution: 612, badges: ['Solar Pioneer'] },
    { name: 'Arjun Nair', contribution: 578, badges: ['Energy Saver'] },
    { name: 'Dinesh R.', contribution: yourContribution, badges: ['Energy Saver'] },
    { name: 'Kavitha M.', contribution: 489, badges: [] },
    { name: 'Suresh V.', contribution: 456, badges: ['Green Champion'] },
    { name: 'Lakshmi S.', contribution: 423, badges: [] },
  ];

  const leaderboard = initialLeaderboard
    .map(item => {
      if (item.name === 'Dinesh R.') {
        return { ...item, contribution: yourContribution };
      }
      return item;
    })
    .sort((a, b) => b.contribution - a.contribution)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Update dynamic progress on the badge configs
  const badges = [
    {
      id: 'solar-pioneer',
      name: 'Solar Pioneer',
      icon: Sun,
      color: '#ffd700',
      desc: 'Generate 500+ kWh from solar',
      requirement: 500,
      progress: yourContribution,
      earned: yourContribution >= 500,
    },
    {
      id: 'green-champion',
      name: 'Green Champion',
      icon: Leaf,
      color: '#39ff14',
      desc: 'Reduce carbon footprint by 30%',
      requirement: 30,
      progress: Math.min(30, Math.round((yourContribution / (totalProduction || 1)) * 300)), // relative progress scale
      earned: yourContribution >= 300,
    },
    {
      id: 'energy-saver',
      name: 'Energy Saver',
      icon: Zap,
      color: '#00f5ff',
      desc: 'Save 200+ kWh in a month',
      requirement: 200,
      progress: Math.min(200, yourContribution),
      earned: yourContribution >= 200,
    },
    {
      id: 'community-leader',
      name: 'Community Leader',
      icon: Crown,
      color: '#bf00ff',
      desc: 'Top 5 contributor for 3 months',
      requirement: 3,
      progress: leaderboard.findIndex(item => item.name === 'Dinesh R.') < 5 ? 3 : 1,
      earned: leaderboard.findIndex(item => item.name === 'Dinesh R.') < 5,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-purple-400" size={24} />
          Community Renewable Energy
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Together, we&apos;re building a sustainable Chennai
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-center"
        >
          <Sun size={24} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Community Solar Total
          </p>
          <p className="text-3xl font-bold text-yellow-400">
            <AnimatedCounter value={totalProduction} />
          </p>
          <p className="text-sm text-gray-500">kWh generated</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-center"
        >
          <Zap size={24} className="text-cyan-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Your Contribution
          </p>
          <p className="text-3xl font-bold text-cyan-400">
            <AnimatedCounter value={yourContribution} />
          </p>
          <p className="text-sm text-gray-500">kWh this month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-center"
        >
          <Target size={24} className="text-green-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            Your Share
          </p>
          <p className="text-3xl font-bold text-green-400">{yourPercentage}%</p>
          <p className="text-sm text-gray-500">of community total</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-yellow-400" />
            Top Contributors
          </h3>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl border p-3 ${getRankBg(entry.rank)} ${
                  entry.name === 'Dinesh R.'
                    ? 'ring-1 ring-cyan-500/40'
                    : ''
                }`}
              >
                <div className="w-6 flex items-center justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    entry.name === 'Dinesh R.' ? 'text-cyan-400' : 'text-white'
                  }`}>
                    {entry.name}
                    {entry.name === 'Dinesh R.' && (
                      <span className="text-xs text-cyan-400/60 ml-1">(You)</span>
                    )}
                  </p>
                  <div className="flex gap-1 mt-0.5">
                    {entry.badges.slice(0, 2).map((badge) => (
                      <span
                        key={badge}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">
                    {entry.contribution}
                  </p>
                  <p className="text-[10px] text-gray-500">kWh</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badges + Challenge */}
        <div className="space-y-6">
          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award size={18} className="text-purple-400" />
              Achievement Badges
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className={`relative rounded-xl border p-4 ${
                    badge.earned
                      ? 'bg-white/5 border-white/15'
                      : 'bg-white/[0.02] border-white/5 opacity-70'
                  }`}
                >
                  {badge.earned && (
                    <div className="absolute top-2 right-2">
                      <Shield size={14} className="text-green-400" />
                    </div>
                  )}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: badge.earned ? `${badge.color}15` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <badge.icon
                      size={22}
                      style={{
                        color: badge.earned ? badge.color : '#4b5563',
                      }}
                    />
                  </div>
                  <p className={`text-sm font-semibold ${badge.earned ? 'text-white' : 'text-gray-500'}`}>
                    {badge.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">{badge.desc}</p>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-400">
                        {badge.progress}/{badge.requirement}
                      </span>
                      {badge.earned ? (
                        <span className="text-green-400 font-bold">Earned ✓</span>
                      ) : (
                        <span className="text-gray-500">
                          {Math.round((badge.progress / badge.requirement) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((badge.progress / badge.requirement) * 100, 100)}%`,
                        }}
                        transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: badge.earned ? badge.color : '#4b5563',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Challenge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" />
                  {monthlyChallenge.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {monthlyChallenge.description}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold shrink-0">
                {monthlyChallenge.daysLeft} days left
              </span>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">
                  {monthlyChallenge.current.toLocaleString('en-IN')} /{' '}
                  {monthlyChallenge.target.toLocaleString('en-IN')} kWh
                </span>
                <span className="text-cyan-400 font-bold">
                  {challengeProgress.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${challengeProgress}%` }}
                  transition={{ duration: 1.5, delay: 0.7 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-400"
                  style={{
                    boxShadow: '0 0 12px rgba(0,245,255,0.3)',
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {monthlyChallenge.participants} participants
              </span>
              <span className="flex items-center gap-1">
                <ChevronUp size={12} className="text-cyan-400" />
                Your contribution:{' '}
                <span className="text-cyan-400 font-bold">
                  {monthlyChallenge.yourContribution} kWh
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
