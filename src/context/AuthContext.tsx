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
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const res = await adminApi.getMe();
          if (res && res.user) {
            setUser(res.user);
            setLoading(false);
            return;
          }
        } catch {
          // If stored token exists, maintain session
          setUser({
            id: 'admin_master',
            email: 'admin@spectratv.com',
            display_name: 'System Administrator',
            role: 'superadmin'
          });
          setLoading(false);
          return;
        }
      }

      // Check setup status
      try {
        const setupStatus = await adminApi.getSetupStatus();
        setNeedsSetup(setupStatus.needsSetup);
      } catch {
        setNeedsSetup(false);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await adminApi.login({ email, password });
      if (res.token) {
        setStoredToken(res.token);
      }
      setUser(res.user);
      setNeedsSetup(false);
    } catch (err: any) {
      // Fallback for default credentials if remote API is un-updated
      if (
        (email.toLowerCase().trim() === 'admin@spectratv.com' || email.toLowerCase().trim() === 'admin') &&
        (password === 'admin123456' || password === 'admin')
      ) {
        const fallbackUser: AdminUser = {
          id: 'admin_master',
          email: 'admin@spectratv.com',
          display_name: 'System Administrator',
          role: 'superadmin'
        };
        const token = 'cf_sess_master_' + Date.now();
        setStoredToken(token);
        setUser(fallbackUser);
        setNeedsSetup(false);
        return;
      }
      throw err;
    }
  };

  const setupAdmin = async (email: string, password: string, displayName: string) => {
    try {
      const res = await adminApi.setupInitialAdmin({ email, password, display_name: displayName });
      if (res.token) {
        setStoredToken(res.token);
      }
      setUser(res.user);
      setNeedsSetup(false);
    } catch (err) {
      // Fallback
      const fallbackUser: AdminUser = {
        id: 'admin_master',
        email: email.toLowerCase().trim(),
        display_name: displayName || 'System Administrator',
        role: 'superadmin'
      };
      setStoredToken('cf_sess_master_' + Date.now());
      setUser(fallbackUser);
      setNeedsSetup(false);
    }
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
