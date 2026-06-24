import React from 'react';
import { useAuth } from '../hooks/useAuth';
import BadgeGallery from '../components/gamification/BadgeGallery';
import { Shield, IdentificationCard, Calendar } from '@phosphor-icons/react';
import { DoubleBezel } from '../components/ui/DoubleBezel';

export const Profile: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
        No user profile active. Please authenticate.
      </div>
    );
  }

  const joinDate = new Date(profile.joinedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 'var(--space-4)',
      boxSizing: 'border-box',
      gap: 'var(--space-6)'
    }}>
      {/* Profile Header Card */}
      <DoubleBezel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--civic-emerald)',
              background: 'var(--surface-input)'
            }}
          />
          <div>
            <h1 style={{ fontSize: '22px', color: 'var(--text-high)', fontWeight: 700 }}>
              {profile.displayName}
            </h1>
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={14} color="var(--civic-emerald)" />
                Level {profile.level}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IdentificationCard size={14} />
                Role: {profile.role}
              </span>
            </div>
          </div>
        </div>
      </DoubleBezel>

      {/* RPG Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-4)'
      }}>
        <div style={{
          background: 'var(--surface-gray)',
          border: '1px solid var(--whisper-line)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Points (XP)</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-high)', marginTop: '4px' }}>
            {profile.points}
          </div>
        </div>

        <div style={{
          background: 'var(--surface-gray)',
          border: '1px solid var(--whisper-line)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Trust Score</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--civic-emerald)', marginTop: '4px' }}>
            {profile.trustScore}%
          </div>
        </div>

        <div style={{
          background: 'var(--surface-gray)',
          border: '1px solid var(--whisper-line)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rank Tier</span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-high)', marginTop: '12px', textTransform: 'uppercase' }}>
            {profile.points >= 100 ? 'Champion' : profile.points >= 50 ? 'Watchdog' : 'Citizen'}
          </div>
        </div>
      </div>

      {/* Accomplishments / Badges */}
      <BadgeGallery userPoints={profile.points} />

      {/* Account Info */}
      <div style={{
        background: 'var(--surface-gray)',
        border: '1px solid var(--whisper-line)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: 'auto'
      }}>
        <Calendar size={16} />
        <span>Registered citizen since {joinDate}</span>
      </div>
    </div>
  );
};
export default Profile;
