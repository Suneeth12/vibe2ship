import React, { useState } from 'react';
import { Issue } from '../../hooks/useIssues';
import { api } from '../../services/api';

import { 
  X, ShieldCheck, MapPin, 
  CheckCircle, Warning, 
  NavigationArrow, Info 
} from '@phosphor-icons/react';
import { DoubleBezel } from '../ui/DoubleBezel';

// Local distance calculation helper using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface IssueDetailProps {
  issue: Issue;
  onClose: () => void;
  userLatitude: number;
  userLongitude: number;
  onVoteSuccess: () => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  onClose,
  userLatitude,
  userLongitude,
  onVoteSuccess,
}) => {
  const [voting, setVoting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Geofence check
  const distance = calculateDistance(userLatitude, userLongitude, issue.latitude, issue.longitude);
  const isOutOfRange = distance > 500;

  const handleVote = async (voteType: 'Confirm' | 'Spam') => {
    if (isOutOfRange) {
      setErrorMessage('Out of Range: You must be within 500m to verify this issue.');
      return;
    }

    setVoting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await api.post('/verifications/vote', {
        issueId: issue.id,
        vote: voteType,
        latitude: userLatitude,
        longitude: userLongitude,
      });

      setSuccessMessage(`Vote recorded! New consensus score: ${response.data.newConsensusScore}`);
      onVoteSuccess();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Community Verified':
        return <span className="badge badge-medium" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--status-info)' }}>Verified</span>;
      case 'Resolved':
        return <span className="badge badge-low" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--status-success)' }}>Resolved</span>;
      case 'Rejected':
        return <span className="badge badge-critical" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--status-critical)' }}>Rejected</span>;
      default:
        return <span className="badge badge-high" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-warning)' }}>Pending</span>;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 'var(--space-4)',
      boxSizing: 'border-box',
      background: 'var(--canvas-ink)',
      position: 'relative'
    }}>
      {/* Detail Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--whisper-line)',
        paddingBottom: 'var(--space-2)'
      }}>
        <h2 style={{ fontSize: '18px', color: 'var(--text-high)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Info size={20} />
          <span>Report Details</span>
        </h2>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Detail Content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Issue Media */}
        {issue.mediaUrl ? (
          <img
            src={issue.mediaUrl}
            alt={issue.category}
            style={{
              width: '100%',
              maxHeight: '220px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--whisper-line)'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '140px',
            background: 'var(--surface-gray)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            No Image Uploaded
          </div>
        )}

        {/* Title + Metadata */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '20px', textTransform: 'capitalize', color: 'var(--text-high)' }}>
              {issue.category.replace('_', ' ')}
            </h1>
            {getStatusBadge(issue.status)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <MapPin size={14} />
            <span>{issue.address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <NavigationArrow size={14} />
            <span>Distance: {distance >= 1000 ? `${(distance/1000).toFixed(1)} km` : `${Math.round(distance)} meters`} away</span>
          </div>
        </div>

        {/* User Description */}
        <DoubleBezel>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--civic-emerald)', marginBottom: '4px' }}>Reporter Notes</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-high)', lineHeight: 1.4 }}>
            {issue.description || 'No user notes provided.'}
          </p>
        </DoubleBezel>

        {/* AI Agent Reasoning Output */}
        <div style={{
          background: 'var(--surface-gray)',
          border: '1px solid var(--whisper-line)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={16} color="var(--civic-emerald)" />
            <span>AI Agent Analysis</span>
          </h4>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: 'var(--text-muted)' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--whisper-line)' }}>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>Subcategory</td>
                <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-high)' }}>{issue.subcategory}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--whisper-line)' }}>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>Severity</td>
                <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-high)' }}>{issue.severity.toUpperCase()}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--whisper-line)' }}>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>Priority Score</td>
                <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-high)', fontWeight: 600 }}>{issue.priorityScore}/10</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--whisper-line)' }}>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>Routing Dept</td>
                <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-high)' }}>{issue.department}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>Confidence</td>
                <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--text-high)' }}>{Math.round(issue.confidence * 100)}%</td>
              </tr>
            </tbody>
          </table>

          {issue.reasoning && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--whisper-line)', paddingTop: '8px', fontStyle: 'italic' }}>
              <strong>AI Reasoning:</strong> {issue.reasoning}
            </p>
          )}
        </div>

        {/* Verification Vote Panel */}
        {issue.status !== 'Resolved' && issue.status !== 'Rejected' && (
          <div style={{
            background: 'var(--surface-gray)',
            border: '1px solid var(--whisper-line)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)'
          }}>
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Community Verification</h4>

            {isOutOfRange ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-3)',
                fontSize: '11px',
                color: 'var(--status-critical)'
              }}>
                <Warning size={18} />
                <span>VOTING BLOCKED: Coordinates are {Math.round(distance)}m away. Move within 500m to verify.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  disabled={voting}
                  onClick={() => handleVote('Confirm')}
                  className="btn btn-primary spring-hover"
                  style={{ flex: 1, background: 'var(--status-success)', color: 'white' }}
                >
                  <CheckCircle size={16} />
                  <span>Confirm Issue</span>
                </button>
                <button
                  disabled={voting}
                  onClick={() => handleVote('Spam')}
                  className="btn btn-secondary spring-hover"
                  style={{ flex: 1, borderColor: 'var(--status-critical)', color: 'var(--status-critical)' }}
                >
                  <X size={16} />
                  <span>Mark Spam</span>
                </button>
              </div>
            )}

            {/* Error and Success alerts */}
            {errorMessage && (
              <div style={{ fontSize: '12px', color: 'var(--status-critical)', marginTop: '4px' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ fontSize: '12px', color: 'var(--status-success)', marginTop: '4px' }}>
                {successMessage}
              </div>
            )}

            {/* Consensus status bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--space-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Verification Consensus Progress</span>
                <span>{issue.consensusScore} / 3.0</span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'var(--status-info)',
                  width: `${Math.min(100, Math.max(0, ((issue.consensusScore + 3) / 6) * 100))}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Consensus reaches 3.0 to verify, falls to -3.0 to reject.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueDetail;
