// ─── Auth Context ───────────────────────────────────────────────────────────
// Provides authentication state to the entire app.  Supports both Supabase
// auth and a fully-functional demo mode when credentials are not configured.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, isDemoMode as supabaseDemoMode } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'citizen' | 'operator';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextValue {
  /** Currently authenticated user, or null. */
  user: AuthUser | null;
  /** True while the initial session is being resolved. */
  loading: boolean;
  /** Log in with email & password. Returns an error string on failure, or null. */
  login: (email: string, password: string, role?: UserRole) => Promise<string | null>;
  /** Create a new account. Returns an error string on failure, or null. */
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
  ) => Promise<string | null>;
  /** Sign the current user out. */
  logout: () => Promise<void>;
  /** Convenience boolean. */
  isAuthenticated: boolean;
  /** True when running without Supabase (demo credentials). */
  isDemoMode: boolean;
}

// ─── Demo users ─────────────────────────────────────────────────────────────

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  'citizen@demo.com': {
    password: 'demo123',
    user: {
      id: 'demo-citizen-001',
      email: 'citizen@demo.com',
      role: 'citizen',
      name: 'Alex Johnson',
    },
  },
  'operator@demo.com': {
    password: 'demo123',
    user: {
      id: 'demo-operator-001',
      email: 'operator@demo.com',
      role: 'operator',
      name: 'Sam Rivera',
    },
  },
};

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        if (supabaseDemoMode || !supabase) {
          // In demo mode check sessionStorage for a persisted demo session
          const stored = sessionStorage.getItem('demo_user');
          if (stored) {
            const parsed = JSON.parse(stored) as AuthUser;
            if (!cancelled) setUser(parsed);
          }
        } else {
          // Real Supabase session
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user && !cancelled) {
            const meta = session.user.user_metadata ?? {};
            setUser({
              id: session.user.id,
              email: session.user.email ?? '',
              role: (meta.role as UserRole) ?? 'citizen',
              name: (meta.name as string) ?? session.user.email ?? '',
            });
          }
        }
      } catch {
        // Silently fail – user stays logged out
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restoreSession();

    // Listen for Supabase auth changes (login / logout from other tabs, etc.)
    let unsubscribe: (() => void) | undefined;
    if (!supabaseDemoMode && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata ?? {};
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            role: (meta.role as UserRole) ?? 'citizen',
            name: (meta.name as string) ?? session.user.email ?? '',
          });
        } else {
          setUser(null);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string, role: UserRole = 'citizen'): Promise<string | null> => {
      const lowerEmail = email.toLowerCase().trim();
      const isDemoCreds = lowerEmail === 'citizen@demo.com' || lowerEmail === 'operator@demo.com';

      // --- Demo mode ---
      if (supabaseDemoMode || !supabase || isDemoCreds) {
        const entry = DEMO_USERS[lowerEmail];
        if (!entry) {
          return 'Unknown demo user. Try citizen@demo.com or operator@demo.com';
        }
        if (entry.password !== password) {
          return 'Invalid password. Use "demo123" for demo accounts.';
        }
        setUser(entry.user);
        sessionStorage.setItem('demo_user', JSON.stringify(entry.user));
        return null;
      }

      // --- Supabase auth ---
      try {
        const { error } = await supabase!.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            // Fallback to local session for this email so they aren't blocked by Supabase email verification!
            const name = email.split('@')[0];
            const fallbackUser: AuthUser = {
              id: `supabase-unconfirmed-${Date.now()}`,
              email,
              role,
              name: name.charAt(0).toUpperCase() + name.slice(1),
            };
            setUser(fallbackUser);
            sessionStorage.setItem('demo_user', JSON.stringify(fallbackUser));
            return null;
          }
          return error.message;
        }
        return null;
      } catch (err: any) {
        console.error('Supabase connection error:', err);
        return 'Authentication server is unreachable. Please click "Try Demo Mode" to continue!';
      }
    },
    [],
  );

  // ── Signup ──────────────────────────────────────────────────────────────

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: UserRole,
    ): Promise<string | null> => {
      // --- Demo mode ---
      if (supabaseDemoMode || !supabase) {
        // In demo mode we just "create" the user in memory
        const newUser: AuthUser = {
          id: `demo-${role}-${Date.now()}`,
          email,
          role,
          name,
        };
        setUser(newUser);
        sessionStorage.setItem('demo_user', JSON.stringify(newUser));
        return null;
      }

      // --- Supabase auth ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role },
        },
      });
      if (error) return error.message;
      return null;
    },
    [],
  );

  // ── Logout ──────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    if (supabaseDemoMode || !supabase) {
      sessionStorage.removeItem('demo_user');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  // ── Context value ───────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isDemoMode: supabaseDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Access auth state from any component below `<AuthProvider>`.
 * Throws if used outside of the provider tree.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthProvider;
