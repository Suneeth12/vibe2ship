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
  
  // Fetch issues centered around user's GPS coords
  const { issues, loading, refetch } = useIssues(
    geo.latitude,
    geo.longitude,
    10000, // 10km radius
    filterStatus
  );

  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);

  const handleSelectIssue = (issue: any) => {
    setSelectedIssue(issue);
    setShowReportForm(false);
    // If on mobile map page, select will trigger popup. If on feed, we show details.
    setActiveTab('feed');
  };

  const handleReportSuccess = () => {
    setShowReportForm(false);
    refetch();
    setActiveTab('feed');
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
          onClose={() => setShowReportForm(false)}
          userLatitude={geo.latitude}
          userLongitude={geo.longitude}
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
      <IssueFeed
        issues={issues}
        loading={loading}
        onSelectIssue={handleSelectIssue}
        onReportClick={() => { setShowReportForm(true); setSelectedIssue(null); }}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
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
    />
  );

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab} mapComponent={mapComponent}>
      {renderLeftPanel()}
    </Shell>
  );
};
export default Dashboard;
