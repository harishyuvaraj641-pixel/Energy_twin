import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, X, Volume2, Clock } from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  icon: string;
}

const DEMO_STEPS: DemoStep[] = [
  { id: 'intro', title: 'Smart City Overview', description: 'AI-Driven Energy Twin - Managing Chennai\'s renewable energy grid', duration: 15, icon: '🌆' },
  { id: 'solar-rise', title: 'Solar Production Rising', description: 'Dawn breaks over Chennai. Solar panels begin generating 4,800 kW as sunlight hits the arrays.', duration: 15, icon: '☀️' },
  { id: 'battery-charge', title: 'Battery Charging', description: 'Excess solar energy flows into battery storage. Banks charging at 2,000 kW. Level: 45% → 78%.', duration: 15, icon: '🔋' },
  { id: 'peak-demand', title: 'Peak Demand & AI Optimization', description: 'AI predicts 5,800 kW peak demand. Automatically delays EV charging and optimizes building loads.', duration: 15, icon: '🧠' },
  { id: 'weather-event', title: 'Weather Event: Cloud Cover', description: 'Cloud cover increases to 70%. Solar drops 60%. Wind turbines compensate with 1,800 kW output.', duration: 15, icon: '🌥️' },
  { id: 'emergency', title: 'Emergency Simulation', description: 'Simulated grid outage detected. AI reroutes power to hospitals and emergency services first.', duration: 15, icon: '🚨' },
  { id: 'recovery', title: 'Grid Recovery', description: 'Battery reserves maintain critical loads. Grid connection restored. Normal operations resuming.', duration: 15, icon: '⚡' },
  { id: 'night-mode', title: 'Night Operations', description: 'Wind energy powers the city. Smart streetlights dim to 40%. EV charging activates at off-peak rates.', duration: 15, icon: '🌙' },
];

const TOTAL_DURATION = DEMO_STEPS.reduce((sum, step) => sum + step.duration, 0);

interface DemoControllerProps {
  onClose?: () => void;
}

const DemoController: React.FC<DemoControllerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = DEMO_STEPS[currentStepIndex];
  const overallProgress = (totalElapsed / TOTAL_DURATION) * 100;

  const startDemo = useCallback(() => {
    setIsPlaying(true);
    setCurrentStepIndex(0);
    setStepProgress(0);
    setTotalElapsed(0);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const skipStep = useCallback(() => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const elapsed = DEMO_STEPS.slice(0, currentStepIndex + 1).reduce((sum, s) => sum + s.duration, 0);
      setCurrentStepIndex(prev => prev + 1);
      setStepProgress(0);
      setTotalElapsed(elapsed);
    } else {
      setIsPlaying(false);
    }
  }, [currentStepIndex]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setStepProgress(prev => {
          const newProgress = prev + 0.1;
          if (newProgress >= currentStep.duration) {
            if (currentStepIndex < DEMO_STEPS.length - 1) {
              setCurrentStepIndex(i => i + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return currentStep.duration;
            }
          }
          return newProgress;
        });
        setTotalElapsed(prev => Math.min(prev + 0.1, TOTAL_DURATION));
      }, 100);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentStepIndex, currentStep.duration]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[600px] max-w-[95vw]"
      >
        <div className="glass-strong rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 30px rgba(0, 245, 255, 0.1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10"
            style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.08), rgba(191,0,255,0.05))' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              <span className="text-sm font-semibold text-white">Live Demo Mode</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(totalElapsed)}s / {TOTAL_DURATION}s
              </span>
              <button onClick={() => { setIsVisible(false); onClose?.(); }} className="text-text-secondary hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="px-5 pt-3">
            <div className="flex gap-1 mb-3">
              {DEMO_STEPS.map((step, i) => (
                <div key={step.id} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: i < currentStepIndex ? '#39ff14' : i === currentStepIndex ? '#00f5ff' : 'transparent',
                      width: i < currentStepIndex ? '100%' : i === currentStepIndex ? `${(stepProgress / step.duration) * 100}%` : '0%',
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Current Step */}
          <div className="px-5 pb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-4"
              >
                <span className="text-3xl">{currentStep.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-neon-cyan mb-1">
                    Step {currentStepIndex + 1}/{DEMO_STEPS.length}: {currentStep.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{currentStep.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 px-5 pb-4">
            {!isPlaying && totalElapsed === 0 ? (
              <motion.button
                onClick={startDemo}
                className="btn-neon-solid text-sm flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-4 h-4" />
                Start Demo
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full flex items-center justify-center neon-border-cyan bg-neon-cyan/10 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-neon-cyan" /> : <Play className="w-4 h-4 text-neon-cyan" />}
                </motion.button>
                <motion.button
                  onClick={skipStep}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <SkipForward className="w-4 h-4 text-text-secondary" />
                </motion.button>
              </>
            )}
          </div>

          {/* Overall Progress Bar */}
          <div className="h-1 bg-white/5">
            <motion.div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #00f5ff, #39ff14, #bf00ff)',
                width: `${overallProgress}%`,
              }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoController;
