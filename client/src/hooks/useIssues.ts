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

    // Track the Firestore listener and the polling interval separately so that
    // a fallback to polling never overwrites (and leaks) the original listener,
    // and repeated errors can't stack multiple intervals.
    let unsubscribeFn: (() => void) | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return; // already polling
      fetchIssuesViaApi();
      intervalId = setInterval(fetchIssuesViaApi, 5000);
    };

    const cleanup = () => {
      if (unsubscribeFn) unsubscribeFn();
      if (intervalId) clearInterval(intervalId);
    };

    try {
      if (db && typeof db.app !== 'undefined' && !isMockFirebase) {
        const issuesQuery = query(
          collection(db, 'issues'),
          orderBy('createdAt', 'desc')
        );

        unsubscribeFn = onSnapshot(
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
            startPolling();
          }
        );
      } else {
        // Fallback directly to API if Firebase client is not connected
        startPolling();
      }
    } catch (err) {
      console.warn('Firestore setup crashed, falling back to API polling:', err);
      startPolling();
    }

    return cleanup;
  }, [lat, lng, radius, status]);

  return {
    issues,
    loading,
    error,
    refetch: fetchIssuesViaApi
  };
}

// Distance helper in meters
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export type { Issue as IssueType };

