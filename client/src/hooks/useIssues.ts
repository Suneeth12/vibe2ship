import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { db, isMockFirebase } from '../config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface Issue {
  id: string;
  reporterId: string;
  mediaUrl: string;
  mediaType: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  subcategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priorityScore: number;
  department: string;
  status: 'Pending' | 'Community Verified' | 'Resolving' | 'Resolved' | 'Rejected';
  consensusScore: number;
  votesCount: number;
  createdAt: string;
  updatedAt: string;
  distance?: number;
  confidence: number;
  reasoning: string;
}

export function useIssues(lat?: number, lng?: number, radius = 5000, status = 'all') {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Poll-based fallback function
  const fetchIssuesViaApi = async () => {
    try {
      const params = { lat, lng, radius, status };
      const response = await api.get('/issues/list', { params });
      setIssues(response.data);
      setError(null);
    } catch (err: any) {
      console.warn('API issue fetch failed:', err);
      setError('Could not sync issues from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);

    // 1. Try real-time Firestore listener first
    let unsubscribe: () => void = () => {};
    
    try {
      if (db && typeof db.app !== 'undefined' && !isMockFirebase) {
        const issuesQuery = query(
          collection(db, 'issues'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(
          issuesQuery,
          (snapshot) => {
            const list: Issue[] = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() } as Issue);
            });
            
            // Filter locally if lat/lng are provided
            let filtered = list;
            if (lat !== undefined && lng !== undefined) {
              // Calculate distance using simple formula
              filtered = list.map(item => {
                const d = getDistance(lat, lng, item.latitude, item.longitude);
                return { ...item, distance: d };
              }).filter(item => (item.distance || 0) <= radius);
              
              filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            }

            if (status !== 'all') {
              filtered = filtered.filter(item => item.status === status);
            }

            setIssues(filtered);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.warn('Firestore onSnapshot failed, falling back to API polling:', err);
            fetchIssuesViaApi();
            // Start API polling interval
            const interval = setInterval(fetchIssuesViaApi, 5000);
            unsubscribe = () => clearInterval(interval);
          }
        );
      } else {
        // Fallback directly to API if Firebase client is not connected
        fetchIssuesViaApi();
        const interval = setInterval(fetchIssuesViaApi, 5000);
        unsubscribe = () => clearInterval(interval);
      }
    } catch (err) {
      console.warn('Firestore setup crashed, falling back to API polling:', err);
      fetchIssuesViaApi();
      const interval = setInterval(fetchIssuesViaApi, 5000);
      unsubscribe = () => clearInterval(interval);
    }

    return () => unsubscribe();
  }, [lat, lng, radius, status]);

  return {
    issues,
    loading,
    error,
    refetch: fetchIssuesViaApi
  };
}

// Distance helper in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
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
export type { Issue as IssueType };
