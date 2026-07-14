import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SimulationProvider } from './contexts/SimulationContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import OperatorDashboard from './pages/OperatorDashboard';

// Protected Route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: 'citizen' | 'operator';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'citizen' ? '/citizen' : '/operator'} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SimulationProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/citizen"
              element={
                <ProtectedRoute allowedRole="citizen">
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator"
              element={
                <ProtectedRoute allowedRole="operator">
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SimulationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
