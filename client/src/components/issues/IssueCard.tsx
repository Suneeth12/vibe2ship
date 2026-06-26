import React from 'react';
import { Issue } from '../../hooks/useIssues';
import { ShieldCheck, Calendar } from '@phosphor-icons/react';
import { sanitize } from '../../services/sanitize';

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onClick }) => {
  const formattedDate = new Date(issue.createdAt).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Community Verified': 'var(--status-info)',
      Resolved: 'var(--status-success)',
      Rejected: 'var(--status-critical)'
    };
    return colors[status] || 'var(--status-warning)';
  };

  const scorePercent = Math.min(100, Math.max(0, Math.round(((issue.consensusScore + 3) / 6) * 100)));

  return (
    <div 
      className="bento-card spring-hover spring-active fade-in" 
      onClick={onClick}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
        background: 'var(--surface-gray)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--whisper-line)',
        padding: 'var(--space-4)',
      }}
    >
      {/* Top row: Category badge + Severity badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span 
            className="badge-status-dot" 
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusColor(issue.status)
            }}
          />
          <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-high)' }}>
            {issue.category.replace('_', ' ')}
          </strong>
        </div>
        <span className={`badge badge-${issue.severity}`}>
          {issue.severity}
        </span>
      </div>

      {/* Main body content */}
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {issue.mediaUrl && (
          <img
            src={issue.mediaUrl}
            alt={issue.category}
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--whisper-line)',
              background: 'var(--surface-input)'
            }}
          />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4
          }}>
            {sanitize(issue.description) || 'No description provided.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} />
              {formattedDate}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} />
              Score: {issue.consensusScore}
            </span>
          </div>
        </div>
      </div>

      {/* Progress consensus bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>Consensus Progress</span>
          <span>{scorePercent}%</span>
        </div>
        <div style={{ height: '4px', background: 'var(--surface-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: issue.consensusScore >= 3.0 ? 'var(--status-success)' : issue.consensusScore <= -3.0 ? 'var(--status-critical)' : 'var(--civic-emerald)',
            width: `${scorePercent}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </div>
  );
};
export default IssueCard;
