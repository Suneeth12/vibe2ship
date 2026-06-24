import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Shield } from '@phosphor-icons/react';

export const Login: React.FC = () => {
  const { loginDemo, loading } = useAuth();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      background: 'var(--canvas-ink)',
      padding: 'var(--space-4)',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        background: 'var(--surface-gray)',
        border: '1px solid var(--whisper-line)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-4)'
      }}>
        {/* Brand Shield Logo */}
        <div style={{
          background: 'var(--civic-emerald-10)',
          border: '1px solid var(--civic-emerald)',
          borderRadius: 'var(--radius-xl)',
          width: '64px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--civic-emerald)',
          marginBottom: 'var(--space-2)'
        }}>
          <Shield size={36} weight="fill" />
        </div>

        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text-high)', fontWeight: 800 }}>COMMUNITY HERO</h1>
          <span style={{ 
            fontSize: '11px', 
            color: 'var(--civic-emerald)', 
            letterSpacing: '0.2em', 
            fontWeight: 800,
            textTransform: 'uppercase',
            display: 'block',
            marginTop: '4px'
          }}>
            Hyperlocal Problem Solver
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, margin: '8px 0 16px 0' }}>
          Connect with municipal departments, report potholes or street damage, and verify community issues. Powered by Gemini AI.
        </p>

        <button
          onClick={loginDemo}
          disabled={loading}
          className="btn btn-primary spring-hover spring-active"
          style={{ width: '100%', height: '48px', fontSize: '15px' }}
        >
          {loading ? 'Initializing Demo Session...' : 'Enter App (Demo Session)'}
        </button>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Note: This utilizes a mock/anonymous session for evaluation.
        </div>
      </div>
    </div>
  );
};
export default Login;
