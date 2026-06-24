import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trophy, Medal, Crown, User } from '@phosphor-icons/react';

interface LeaderboardUser {
  userId: string;
  displayName: string;
  points: number;
  level: number;
}

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/users/leaderboard');
        setUsers(response.data);
      } catch (err) {
        console.warn('Failed to fetch leaderboard from API, utilizing mock rankings:', err);
        // Fallback mock leaderboard rankings
        setUsers([
          { userId: '1', displayName: 'Aria Sterling', points: 450, level: 4 },
          { userId: '2', displayName: 'Marcus Vance', points: 380, level: 3 },
          { userId: '3', displayName: 'Elena Rostova', points: 310, level: 3 },
          { userId: '4', displayName: 'SuneethReddy', points: 280, level: 2 },
          { userId: '5', displayName: 'Kaelen Thorne', points: 190, level: 2 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown size={22} color="#FBBF24" weight="fill" />;
      case 2: return <Medal size={20} color="#D1D5DB" weight="fill" />;
      case 3: return <Medal size={20} color="#F59E0B" weight="fill" />;
      default: return <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>{rank}</span>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 'var(--space-4)',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={28} color="var(--civic-emerald)" weight="fill" />
          <span>City Leaderboard</span>
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Top citizen contributors verifying and resolving hyperlocal issues.
        </p>
      </div>

      <div style={{
        background: 'var(--surface-gray)',
        border: '1px solid var(--whisper-line)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading rankings...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--whisper-line)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Rank</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Contributor</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Level</th>
                <th style={{ padding: '14px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr 
                  key={u.userId} 
                  style={{ 
                    borderBottom: i < users.length - 1 ? '1px solid var(--whisper-line)' : 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle', width: '60px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '24px' }}>
                      {getRankIcon(i + 1)}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--surface-input)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--whisper-line)'
                      }}>
                        <User size={16} />
                      </div>
                      <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-high)' }}>
                        {u.displayName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'center', color: 'var(--civic-emerald)', fontWeight: 600, fontSize: '13px' }}>
                    {u.level}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 700, color: 'var(--text-high)', fontSize: '14px' }}>
                    {u.points} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default Leaderboard;
