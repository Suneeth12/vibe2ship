import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { List, Trophy, User, SignOut, Shield } from '@phosphor-icons/react';

interface SidebarProps {
  activeTab: 'feed' | 'map' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'feed' | 'map' | 'leaderboard' | 'profile') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { profile, logout } = useAuth();

  return (
    <aside className="sidebar-desktop" style={{
      width: '260px',
      height: '100%',
      background: 'var(--surface-gray)',
      borderRight: '1px solid var(--whisper-line)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-6)',
      boxSizing: 'border-box',
    }}>
      {/* Brand Logo */}
      <div className="sidebar-logo" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-12)'
      }}>
        <div style={{
          background: 'var(--civic-emerald-10)',
          border: '1px solid var(--civic-emerald)',
          borderRadius: 'var(--radius-md)',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--civic-emerald)'
        }}>
          <Shield size={22} weight="fill" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', color: 'var(--text-high)' }}>COMMUNITY</h2>
          <span style={{ fontSize: '11px', color: 'var(--civic-emerald)', letterSpacing: '0.15em', fontWeight: 700 }}>HERO</span>
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="sidebar-nav" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)'
      }}>
        <button
          onClick={() => setActiveTab('feed')}
          className={`sidebar-nav-item ${activeTab === 'feed' ? 'active' : ''}`}
          style={getNavStyle(activeTab === 'feed')}
        >
          <List size={20} />
          <span>Issues Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`sidebar-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          style={getNavStyle(activeTab === 'leaderboard')}
        >
          <Trophy size={20} />
          <span>Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          style={getNavStyle(activeTab === 'profile')}
        >
          <User size={20} />
          <span>My Profile</span>
        </button>
      </nav>

      {/* Profile Footer */}
      {profile && (
        <div className="sidebar-footer" style={{
          borderTop: '1px solid var(--whisper-line)',
          paddingTop: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--whisper-line)'
              }}
            />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '14px', 
                color: 'var(--text-high)',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}>
                {profile.displayName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Level {profile.level} • {profile.points} pts
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '8px 0',
              textAlign: 'left',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-critical)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <SignOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

const getNavStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: '12px 16px',
  background: isActive ? 'var(--civic-emerald-10)' : 'transparent',
  color: isActive ? 'var(--civic-emerald)' : 'var(--text-muted)',
  border: 'none',
  outline: 'none',
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  transition: 'all var(--duration-fast) var(--spring-smooth)'
});

export default Sidebar;
