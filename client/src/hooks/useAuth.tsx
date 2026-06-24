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

  // Sync profile from backend
  const syncProfile = async (uid: string) => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.warn('Error fetching user profile from server:', error);
      // Fallback local profile if backend is not initialized/accessible
      setProfile({
        id: uid,
        email: 'localhero@example.com',
        displayName: 'Local Hero',
        avatarUrl: `https://picsum.photos/seed/${uid}/100`,
        role: 'reporter',
        points: 120,
        level: 2,
        trustScore: 75,
        joinedAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    // 1. Check if there was a mock session active
    if (localStorage.getItem('is_mock_session') === 'true') {
      const mockUid = localStorage.getItem('demo_user_uid') || 'demo_user_id';
      setUser({ uid: mockUid, email: 'demo@communityhero.org' } as any);
      setProfile({
        id: mockUid,
        email: 'demo@communityhero.org',
        displayName: 'Demo Hero',
        avatarUrl: 'https://picsum.photos/seed/demo/100',
        role: 'reporter',
        points: 50,
        level: 1,
        trustScore: 60,
        joinedAt: new Date().toISOString()
      });
      setLoading(false);
      return;
    }

    // 2. If auth is mock or fails, we will check state
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      // Mock auth fallback
      setUser({ uid: 'mock_uid_123', email: 'mock@example.com' } as any);
      setProfile({
        id: 'mock_uid_123',
        email: 'mock@example.com',
        displayName: 'Mock Citizen Hero',
        avatarUrl: 'https://picsum.photos/seed/mock/100',
        role: 'reporter',
        points: 350,
        level: 3,
        trustScore: 85,
        joinedAt: new Date().toISOString()
      });
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
      // Login anonymously for fast hackathon demo
      if (auth && typeof signInAnonymously === 'function') {
        const cred = await signInAnonymously(auth);
        localStorage.removeItem('is_mock_session');
        localStorage.removeItem('demo_user_uid');
        setUser(cred.user);
        await syncProfile(cred.user.uid);
      }
    } catch (error) {
      console.error('Demo authentication failed:', error);
      // Fallback mock session
      const mockUid = 'demo_user_id';
      localStorage.setItem('is_mock_session', 'true');
      localStorage.setItem('demo_user_uid', mockUid);
      setUser({ uid: mockUid, email: 'demo@communityhero.org' } as any);
      setProfile({
        id: mockUid,
        email: 'demo@communityhero.org',
        displayName: 'Demo Hero',
        avatarUrl: 'https://picsum.photos/seed/demo/100',
        role: 'reporter',
        points: 50,
        level: 1,
        trustScore: 60,
        joinedAt: new Date().toISOString()
      });
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
