'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ApiError } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  googleAuth: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      let cachedUser: User;
      try { cachedUser=JSON.parse(storedUser); } catch {
        localStorage.removeItem('auth_token');localStorage.removeItem('auth_user');setIsLoading(false);return;
      }
      setToken(storedToken);
      setUser(cachedUser);
      // Verify token is still valid
      api.get('/auth/me', storedToken)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        })
        .catch((error: unknown) => {
          // A transport/server failure must not discard an otherwise valid login.
          // Protected API calls still enforce the existing JWT and role guards.
          if (!(error instanceof ApiError) || ![401,403].includes(error.status)) return;
          // Token rejected, clear auth state
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, token: authToken } = response;

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    const { user: userData, token: authToken } = response;

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const googleAuth = async (credential: string) => {
    const response = await api.post('/auth/google', { credential });
    const { user: userData, token: authToken } = response;

    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, googleAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
