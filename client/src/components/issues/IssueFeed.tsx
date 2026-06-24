import React, { useState } from 'react';
import { Issue } from '../../hooks/useIssues';
import IssueCard from './IssueCard';
import { MagnifyingGlass, Plus, Funnel } from '@phosphor-icons/react';

interface IssueFeedProps {
  issues: Issue[];
  loading: boolean;
  onSelectIssue: (issue: Issue) => void;
  onReportClick: () => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({
  issues,
  loading,
  onSelectIssue,
  onReportClick,
  filterStatus,
  setFilterStatus
}) => {
  const [search, setSearch] = useState('');
  const term = search.toLowerCase();
  const filteredIssues = issues.filter(i => 
    i.category.toLowerCase().includes(term) ||
    i.description.toLowerCase().includes(term) ||
    i.address.toLowerCase().includes(term)
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 'var(--space-4)',
      boxSizing: 'border-box'
    }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-4)'
      }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text-high)' }}>Hyperlocal Issues</h1>
        <button 
          className="btn btn-primary spring-hover spring-active"
          onClick={onReportClick}
        >
          <Plus size={16} weight="bold" />
          <span>Report</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <MagnifyingGlass 
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
          />
          <input
            type="text"
            placeholder="Search category, location, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '40px', marginBottom: 0 }}
          />
        </div>

        {/* Tab Filters */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--whisper-line)'
        }}>
          {['all', 'Pending', 'Community Verified', 'Resolved', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                background: filterStatus === status ? 'var(--civic-emerald-10)' : 'transparent',
                color: filterStatus === status ? 'var(--civic-emerald)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--duration-fast)'
              }}
            >
              {status === 'all' ? 'All Reports' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Issues list content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="skeleton" 
              style={{ height: '140px', width: '100%', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-lg)' }} 
            />
          ))
        ) : filteredIssues.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'var(--text-muted)',
            gap: 'var(--space-2)'
          }}>
            <Funnel size={32} />
            <span>No reports found matching criteria.</span>
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <IssueCard 
              key={issue.id} 
              issue={issue} 
              onClick={() => onSelectIssue(issue)} 
            />
          ))
        )}
      </div>
    </div>
  );
};
export default IssueFeed;
