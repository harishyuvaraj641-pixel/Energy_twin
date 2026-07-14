import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Zap, Shield, ArrowRight, Loader2 } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import { useAuth } from '../contexts/AuthContext';

type Role = 'citizen' | 'operator';
type Mode = 'signin' | 'signup';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, signup } = useAuth();

  const [role, setRole] = useState<Role>('citizen');
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect on successful auth
  useEffect(() => {
    if (user) {
      navigate(user.role === 'operator' ? '/operator' : '/citizen');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let err: string | null = null;
      if (mode === 'signup') {
        err = await signup(email, password, name, role);
      } else {
        err = await login(email, password, role);
      }
      if (err) {
        setError(err);
      } else {
        navigate(role === 'operator' ? '/operator' : '/citizen');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = role === 'operator' ? 'operator@demo.com' : 'citizen@demo.com';
      const err = await login(demoEmail, 'demo123', role);
      if (err) {
        setError(err);
      } else {
        navigate(role === 'operator' ? '/operator' : '/citizen');
      }
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <ParticleBackground />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="glass-strong rounded-2xl p-8">
          {/* ── Logo / Title ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
              <Zap className="w-7 h-7 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">AI-Driven Energy Twin</h1>
            <p className="text-text-secondary text-sm mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {/* ── Role Tabs ── */}
          <div className="relative flex mb-8 bg-bg-primary/60 rounded-xl p-1">
            {/* Animated tab indicator */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-neon-cyan/15 border border-neon-cyan/25"
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                width: 'calc(50% - 4px)',
                left: role === 'citizen' ? '4px' : 'calc(50% + 0px)',
              }}
            />
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                role === 'citizen' ? 'text-neon-cyan' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <User className="w-4 h-4" /> Citizen
            </button>
            <button
              type="button"
              onClick={() => setRole('operator')}
              className={`relative z-10 flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                role === 'operator' ? 'text-neon-cyan' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Shield className="w-4 h-4" /> Operator
            </button>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  key="name-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input-neon pl-10"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-neon pl-10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-neon pl-10"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-neon-red text-sm text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-neon-solid w-full flex items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Toggle Mode ── */}
          <p className="text-center text-sm text-text-secondary mt-5">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-neon-cyan hover:underline font-medium"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          {/* ── Demo Login ── */}
          <div className="mt-6 pt-5 border-t border-white/5">
            <button
              type="button"
              onClick={handleDemo}
              className="w-full btn-neon flex items-center justify-center gap-2 text-sm py-3"
            >
              <Zap className="w-4 h-4" />
              Try Demo Mode
              <span className="text-[10px] uppercase tracking-wider ml-1 opacity-60">
                ({role})
              </span>
            </button>
          </div>
        </div>

        {/* ── Bottom Branding ── */}
        <p className="text-center text-[11px] text-text-dim mt-6">
          AI-Driven Energy Twin © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
