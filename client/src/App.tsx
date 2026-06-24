import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Shield } from '@phosphor-icons/react';

// Main Application entry styling imports
import './styles/index.css';
import './styles/components.css';
import './styles/animations.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'map' | 'leaderboard' | 'profile'>('feed');

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: 'var(--canvas-ink)',
        color: 'var(--text-muted)',
        gap: 'var(--space-4)'
      }}>
        <div style={{
          background: 'var(--civic-emerald-10)',
          border: '1px solid var(--civic-emerald)',
          borderRadius: 'var(--radius-xl)',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--civic-emerald)',
          animation: 'pulse 1.5s infinite'
        }}>
          <Shield size={28} weight="fill" />
        </div>
        <span style={{ fontSize: '13px', letterSpacing: '0.05em', fontWeight: 500 }}>
          Initializing Platform...
        </span>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  // If user is not authenticated, redirect to Login
  if (!user) {
    return <Login />;
  }

  return (
    <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
