import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import { Compass, List, Trophy, User } from '@phosphor-icons/react';

interface ShellProps {
  children: React.ReactNode;
  activeTab: 'feed' | 'map' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'feed' | 'map' | 'leaderboard' | 'profile') => void;
  mapComponent: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  mapComponent 
}) => {
  const [mobileShowMap, setMobileShowMap] = useState(false);

  // Static responsive CSS — built once. The content/map toggle is driven by a
  // class on the container (below) rather than interpolating into this string,
  // so it isn't rebuilt on every render.
  const responsiveStyles = useMemo(() => `
    @media (max-width: 768px) {
      .shell-container {
        flex-direction: column;
      }
      .sidebar-desktop {
        display: none !important;
      }
      .main-content {
        margin-bottom: 64px; /* offset bottom nav */
      }
      .content-panel { width: 100% !important; }
      .map-panel { width: 100% !important; }
      .shell-container.show-content .content-panel { display: flex !important; }
      .shell-container.show-content .map-panel { display: none !important; }
      .shell-container.show-map .content-panel { display: none !important; }
      .shell-container.show-map .map-panel { display: block !important; }
      .mobile-map-toggle {
        display: flex !important;
      }
      .mobile-nav {
        display: flex !important;
      }
    }
  `, []);

  return (
    <div className={`shell-container ${mobileShowMap ? 'show-map' : 'show-content'}`} style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: 'var(--canvas-ink)'
    }}>
      {/* Sidebar for Desktop */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-content" style={{
        flex: 1,
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left Side: Feed / Content (Leaderboard, Profile, Details) */}
        <section className={`content-panel ${activeTab !== 'map' && !mobileShowMap ? 'active' : ''}`} style={{
          width: '45%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          borderRight: '1px solid var(--whisper-line)',
          transition: 'all 0.3s ease'
        }}>
          {children}
        </section>

        {/* Right Side: Geolocation Interactive Map (55% width) */}
        <section className={`map-panel ${activeTab === 'map' || mobileShowMap ? 'active' : ''}`} style={{
          width: '55%',
          height: '100%',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}>
          {mapComponent}
        </section>

        {/* Floating Mobile Toggle Button */}
        <button 
          className="mobile-map-toggle"
          onClick={() => setMobileShowMap(!mobileShowMap)}
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '20px',
            zIndex: 1000,
            background: 'var(--civic-emerald)',
            color: 'var(--canvas-ink)',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            width: '56px',
            height: '56px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
            display: 'none', // Shown in CSS media query below
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {mobileShowMap ? <List size={24} /> : <Compass size={24} />}
        </button>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'var(--surface-gray)',
        borderTop: '1px solid var(--whisper-line)',
        display: 'none', // Shown in CSS media query
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1001
      }}>
        <button 
          onClick={() => { setActiveTab('feed'); setMobileShowMap(false); }}
          className={`mobile-nav-item ${activeTab === 'feed' && !mobileShowMap ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'feed' && !mobileShowMap ? 'var(--civic-emerald)' : 'var(--text-muted)' }}
        >
          <List size={20} />
          <span style={{ fontSize: '10px', display: 'block' }}>Feed</span>
        </button>
        <button 
          onClick={() => { setActiveTab('map'); setMobileShowMap(true); }}
          className={`mobile-nav-item ${mobileShowMap ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: mobileShowMap ? 'var(--civic-emerald)' : 'var(--text-muted)' }}
        >
          <Compass size={20} />
          <span style={{ fontSize: '10px', display: 'block' }}>Map</span>
        </button>
        <button 
          onClick={() => { setActiveTab('leaderboard'); setMobileShowMap(false); }}
          className={`mobile-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'leaderboard' ? 'var(--civic-emerald)' : 'var(--text-muted)' }}
        >
          <Trophy size={20} />
          <span style={{ fontSize: '10px', display: 'block' }}>Ranks</span>
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); setMobileShowMap(false); }}
          className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'profile' ? 'var(--civic-emerald)' : 'var(--text-muted)' }}
        >
          <User size={20} />
          <span style={{ fontSize: '10px', display: 'block' }}>Profile</span>
        </button>
      </nav>

      {/* Media Queries (Injected Inline Styles because of vanilla approach) */}
      <style>{responsiveStyles}</style>
    </div>
  );
};
export default Shell;
