import React, { useState } from 'react';
import { useIssues } from '../hooks/useIssues';
import { useGeolocation } from '../hooks/useGeolocation';
import Shell from '../components/layout/Shell';
import MapView from '../components/map/MapView';
import IssueFeed from '../components/issues/IssueFeed';
import IssueDetail from '../components/issues/IssueDetail';
import ReportForm from '../components/issues/ReportForm';
import Leaderboard from '../components/gamification/Leaderboard';
import Profile from './Profile';

interface DashboardProps {
  activeTab: 'feed' | 'map' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'feed' | 'map' | 'leaderboard' | 'profile') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, setActiveTab }) => {
  const geo = useGeolocation();
  const [filterStatus, setFilterStatus] = useState('all');

  // Expose geo globally for headless devtools testing
  if (typeof window !== 'undefined') {
    (window as any).geo = geo;
  }
  
  // Fetch issues centered around user's GPS coords
  const { issues, loading, refetch } = useIssues(
    geo.latitude,
    geo.longitude,
    10000, // 10km radius
    filterStatus
  );

  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleSelectIssue = (issue: any) => {
    setSelectedIssue(issue);
    setShowReportForm(false);
    setReportCoords(null);
    // If on mobile map page, select will trigger popup. If on feed, we show details.
    setActiveTab('feed');
  };

  const handleReportSuccess = () => {
    setShowReportForm(false);
    setReportCoords(null);
    refetch();
    setActiveTab('feed');
  };

  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    const results: any = {
      gpsHigh: 'Running...',
      gpsLow: 'Running...',
      ipapi: 'Running...',
      dbip: 'Running...',
      ipinfo: 'Running...'
    };
    setDiagnostics({ ...results });

    // 1. GPS High Accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          results.gpsHigh = `Success: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Acc: ${pos.coords.accuracy}m)`;
          setDiagnostics({ ...results });
        },
        (err) => {
          results.gpsHigh = `Error ${err.code}: ${err.message}`;
          setDiagnostics({ ...results });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );

      // 2. GPS Low Accuracy
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          results.gpsLow = `Success: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)} (Acc: ${pos.coords.accuracy}m)`;
          setDiagnostics({ ...results });
        },
        (err) => {
          results.gpsLow = `Error ${err.code}: ${err.message}`;
          setDiagnostics({ ...results });
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    } else {
      results.gpsHigh = 'Not supported';
      results.gpsLow = 'Not supported';
      setDiagnostics({ ...results });
    }

    // 3. IP Geolocation (ipapi.co)
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        results.ipapi = `Success: Lat ${data.latitude}, Lng ${data.longitude} (${data.city}, ${data.country_name})`;
        setDiagnostics({ ...results });
      })
      .catch(e => {
        results.ipapi = `Failed: ${e.message}`;
        setDiagnostics({ ...results });
      });

    // 4. IP Geolocation (db-ip.com)
    fetch('https://api.db-ip.com/v2/free/self')
      .then(r => r.json())
      .then(data => {
        results.dbip = `Success: IP ${data.ipAddress} (${data.city}, ${data.countryName})`;
        setDiagnostics({ ...results });
      })
      .catch(e => {
        results.dbip = `Failed: ${e.message}`;
        setDiagnostics({ ...results });
      });

    // 5. IP Geolocation (ipinfo.io)
    fetch('https://ipinfo.io/json')
      .then(r => r.json())
      .then(data => {
        results.ipinfo = `Success: Loc ${data.loc} (${data.city}, ${data.country})`;
        setDiagnostics({ ...results });
      })
      .catch(e => {
        results.ipinfo = `Failed: ${e.message}`;
        setDiagnostics({ ...results });
      });

    setRunningDiagnostics(false);
  };

  const renderLeftPanel = () => {
    if (activeTab === 'leaderboard') {
      return <Leaderboard />;
    }
    if (activeTab === 'profile') {
      return <Profile />;
    }
    if (showReportForm) {
      return (
        <ReportForm
          onClose={() => {
            setShowReportForm(false);
            setReportCoords(null);
          }}
          userLatitude={reportCoords?.lat ?? geo.latitude}
          userLongitude={reportCoords?.lng ?? geo.longitude}
          userAddress={geo.error ? 'Default Geolocation Location' : ''}
          onReportSuccess={handleReportSuccess}
        />
      );
    }
    if (selectedIssue) {
      return (
        <IssueDetail
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          userLatitude={geo.latitude}
          userLongitude={geo.longitude}
          onVoteSuccess={refetch}
        />
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Geolocation Status Indicator Banner */}
        <div style={{
          margin: 'var(--space-4) var(--space-4) 0 var(--space-4)',
          padding: '10px 14px',
          background: 'var(--surface-gray)',
          border: '1px solid var(--whisper-line)',
          borderRadius: 'var(--radius-md)',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-high)' }}>
              Location Mode: {geo.loading ? 'Determining...' : geo.isFallback ? '⚠️ IP Fallback' : '📡 GPS Active'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
              Lat: {geo.latitude.toFixed(6)}, Lng: {geo.longitude.toFixed(6)} {geo.error ? `(${geo.error})` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button"
              onClick={runDiagnostics}
              disabled={runningDiagnostics}
              style={{
                background: 'var(--surface-gray)',
                color: 'var(--text-muted)',
                border: '1px solid var(--whisper-line)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {runningDiagnostics ? 'Diagnosing...' : 'Diagnostics'}
            </button>
            <button 
              type="button"
              onClick={() => geo.refresh()}
              style={{
                background: 'var(--civic-emerald-10)',
                color: 'var(--civic-emerald)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              Retry GPS
            </button>
          </div>
        </div>

        {/* Collapsible Diagnostics Panel */}
        {diagnostics && (
          <div style={{
            margin: 'var(--space-2) var(--space-4) 0 var(--space-4)',
            padding: '12px',
            background: 'var(--canvas-ink)',
            border: '1px solid var(--whisper-line)',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-high)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Location Diagnostics</span>
              <button 
                type="button"
                onClick={() => setDiagnostics(null)}
                style={{ background: 'none', border: 'none', color: 'var(--status-critical)', cursor: 'pointer', fontSize: '11px' }}
              >
                Close
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>GPS (High Accuracy):</strong> {diagnostics.gpsHigh}</div>
              <div><strong>GPS (Low Accuracy):</strong> {diagnostics.gpsLow}</div>
              <div><strong>IP (ipapi.co):</strong> {diagnostics.ipapi}</div>
              <div><strong>IP (db-ip.com):</strong> {diagnostics.dbip}</div>
              <div><strong>IP (ipinfo.io):</strong> {diagnostics.ipinfo}</div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <IssueFeed
            issues={issues}
            loading={loading}
            onSelectIssue={handleSelectIssue}
            onReportClick={() => {
              setReportCoords({ lat: geo.latitude, lng: geo.longitude });
              setShowReportForm(true);
              setSelectedIssue(null);
            }}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        </div>
      </div>
    );
  };

  const mapComponent = (
    <MapView
      issues={issues}
      selectedIssue={selectedIssue}
      onSelectIssue={handleSelectIssue}
      centerLatitude={geo.latitude}
      centerLongitude={geo.longitude}
      interactive={showReportForm}
      reportLatitude={reportCoords?.lat}
      reportLongitude={reportCoords?.lng}
      onLocationSelect={(lat, lng) => setReportCoords({ lat, lng })}
    />
  );

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab} mapComponent={mapComponent}>
      {renderLeftPanel()}
    </Shell>
  );
};
export default Dashboard;
