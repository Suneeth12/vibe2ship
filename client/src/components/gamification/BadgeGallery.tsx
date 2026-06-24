import React from 'react';
import { Trophy, Compass, Eye, Shield, CheckSquare } from '@phosphor-icons/react';

interface Badge {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  icon: React.ReactNode;
}

interface BadgeGalleryProps {
  userPoints: number;
}

export const BadgeGallery: React.FC<BadgeGalleryProps> = ({ userPoints }) => {
  const badges: Badge[] = [
    {
      id: 'first_report',
      title: 'First Responder',
      description: 'Submitted your first community infrastructure issue.',
      earned: userPoints >= 10,
      icon: <Compass size={24} />
    },
    {
      id: 'active_voter',
      title: 'Civic Validator',
      description: 'Earned 20+ XP by validating nearby reported issues.',
      earned: userPoints >= 20,
      icon: <CheckSquare size={24} />
    },
    {
      id: 'trust_builder',
      title: 'Trust Sentinel',
      description: 'Helped verify multiple valid tickets, raising trust scores.',
      earned: userPoints >= 50,
      icon: <Eye size={24} />
    },
    {
      id: 'community_hero',
      title: 'Community Hero',
      description: 'Earned 100+ XP through proactive hyperlocal reporting.',
      earned: userPoints >= 100,
      icon: <Shield size={24} />
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy size={20} color="var(--civic-emerald)" />
        <span>Earned Accomplishments</span>
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 'var(--space-4)'
      }}>
        {badges.map((b) => (
          <div
            key={b.id}
            style={{
              background: b.earned ? 'var(--surface-gray)' : 'rgba(255,255,255,0.01)',
              border: '1px solid var(--whisper-line)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
              opacity: b.earned ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              background: b.earned ? 'var(--civic-emerald-10)' : 'var(--surface-input)',
              border: '1px solid',
              borderColor: b.earned ? 'var(--civic-emerald)' : 'var(--whisper-line)',
              borderRadius: 'var(--radius-md)',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: b.earned ? 'var(--civic-emerald)' : 'var(--text-muted)',
              flexShrink: 0
            }}>
              {b.icon}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', color: 'var(--text-high)', fontWeight: 600 }}>{b.title}</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.3 }}>{b.description}</p>
              {b.earned ? (
                <span style={{ fontSize: '9px', color: 'var(--civic-emerald)', fontWeight: 600, display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>UNLOCKED</span>
              ) : (
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textTransform: 'uppercase' }}>LOCKED</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default BadgeGallery;
