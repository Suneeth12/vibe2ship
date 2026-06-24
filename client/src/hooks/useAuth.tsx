import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { api } from '../services/api';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'reporter' | 'validator' | 'admin';
  points: number;
  level: number;
  trustScore: number;
  joinedAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to set mock/demo user state
  const setMockAuth = (uid: string, name: string, points = 50, level = 1, trustScore = 60) => {
    setUser({ uid, email: `${uid}@communityhero.org` } as any);
    setProfile({
      id: uid,
      email: `${uid}@communityhero.org`,
      displayName: name,
      avatarUrl: `https://picsum.photos/seed/${uid}/100`,
      role: 'reporter',
      points,
      level,
      trustScore,
      joinedAt: new Date().toISOString()
    });
  };

  // Sync profile from backend
  const syncProfile = async (uid: string) => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.warn('Error fetching user profile from server:', error);
      setMockAuth(uid, 'Local Hero', 120, 2, 75);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('is_mock_session') === 'true') {
      const mockUid = localStorage.getItem('demo_user_uid') || 'demo_user_id';
      setMockAuth(mockUid, 'Demo Hero');
      setLoading(false);
      return;
    }

    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setMockAuth('mock_uid_123', 'Mock Citizen Hero', 350, 3, 85);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('is_mock_session');
        localStorage.removeItem('demo_user_uid');
        setUser(firebaseUser);
        await syncProfile(firebaseUser.uid);
      } else {
        if (localStorage.getItem('is_mock_session') !== 'true') {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginDemo = async () => {
    setLoading(true);
    try {
      if (auth && typeof signInAnonymously === 'function') {
        const cred = await signInAnonymously(auth);
        localStorage.removeItem('is_mock_session');
        localStorage.removeItem('demo_user_uid');
        setUser(cred.user);
        await syncProfile(cred.user.uid);
      }
    } catch (error) {
      console.error('Demo authentication failed:', error);
      const mockUid = 'demo_user_id';
      localStorage.setItem('is_mock_session', 'true');
      localStorage.setItem('demo_user_uid', mockUid);
      setMockAuth(mockUid, 'Demo Hero');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (auth && typeof signOut === 'function') {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('is_mock_session');
      localStorage.removeItem('demo_user_uid');
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginDemo,
      logout,
      refreshProfile: () => user && syncProfile(user.uid)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
