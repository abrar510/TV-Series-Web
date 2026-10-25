import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { adminApi, setStoredToken, getStoredToken } from '../services/api';

interface AuthContextType {
  user: AdminUser | null;
  loading: boolean;
  needsSetup: boolean;
  login: (email: string, password: string) => Promise<void>;
  setupAdmin: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const checkAuth = async () => {
    try {
      // Check setup status
      const setupStatus = await adminApi.getSetupStatus();
      setNeedsSetup(setupStatus.needsSetup);

      if (setupStatus.needsSetup) {
        setUser(null);
        setStoredToken(null);
        setLoading(false);
        return;
      }

      // Check me if token or session exists
      const res = await adminApi.getMe();
      if (res && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await adminApi.login({ email, password });
    if (res.token) {
      setStoredToken(res.token);
    }
    setUser(res.user);
    setNeedsSetup(false);
  };

  const setupAdmin = async (email: string, password: string, displayName: string) => {
    const res = await adminApi.setupInitialAdmin({ email, password, display_name: displayName });
    if (res.token) {
      setStoredToken(res.token);
    }
    setUser(res.user);
    setNeedsSetup(false);
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {}
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, needsSetup, login, setupAdmin, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
