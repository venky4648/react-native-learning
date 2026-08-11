import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

export type User = {
  _id: string;
  name: string;
  email: string;
  token: string;
};

type MicrosoftAuthData = {
  email: string;
  name?: string;
  microsoftId?: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithMicrosoft: (data: MicrosoftAuthData) => Promise<void>;
  fetchUserProfile: () => Promise<any>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Connection timed out. Please check if your backend server is running and accessible.');
    }
    throw error;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load stored user session on startup
  useEffect(() => {
    const loadSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('@user_session');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Error loading session from storage:', err);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[Email Login] Attempting login for email:', email);
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('[Email Login] Backend response code:', response.status, 'body:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      const userObj = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
      };

      setUser(userObj);
      await AsyncStorage.setItem('@user_session', JSON.stringify(userObj));
      console.log('[Email Login] Login successful! Saved user session to AsyncStorage.');
    } catch (error: any) {
      console.error('[Email Login] Login failed:', error.message);
      throw new Error(error.message || 'Network error. Make sure your backend server is running.');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      console.log('[Email Signup] Attempting signup for name:', name, 'email:', email);
      const response = await fetchWithTimeout(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log('[Email Signup] Backend response code:', response.status, 'body:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed. Please try again.');
      }

      const userObj = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
      };

      setUser(userObj);
      await AsyncStorage.setItem('@user_session', JSON.stringify(userObj));
      console.log('[Email Signup] Signup successful! Saved user session to AsyncStorage.');
    } catch (error: any) {
      console.error('[Email Signup] Signup failed:', error.message);
      throw new Error(error.message || 'Network error. Make sure your backend server is running.');
    }
  };

  const loginWithMicrosoft = async (microsoftData: MicrosoftAuthData) => {
    try {
      console.log('[Backend Auth] Sending Microsoft profile to backend:', JSON.stringify(microsoftData));
      const response = await fetchWithTimeout(`${API_URL}/auth/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(microsoftData),
      });

      const data = await response.json();
      console.log('[Backend Auth] Backend response code:', response.status, 'body:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Microsoft Sign-In failed. Please try again.');
      }

      const userObj = {
        _id: data._id,
        name: data.name,
        email: data.email,
        token: data.token,
      };

      setUser(userObj);
      await AsyncStorage.setItem('@user_session', JSON.stringify(userObj));
      console.log('[Backend Auth] Logged in successfully! Saved user to AsyncStorage.');
    } catch (error: any) {
      console.error('[Backend Auth] Microsoft login failed:', error.message);
      throw new Error(error.message || 'Network error. Make sure your backend server is running.');
    }
  };

  /**
   * Fetches user profile from protected backend route sending Authorization Bearer token.
   */
  const fetchUserProfile = async () => {
    if (!user || !user.token) {
      throw new Error('Not authorized: No JWT token found');
    }

    const response = await fetchWithTimeout(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await logout(); // Auto logout if token expired or invalid
      }
      throw new Error(data.message || 'Failed to fetch protected profile');
    }

    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('@user_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, loginWithMicrosoft, fetchUserProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
