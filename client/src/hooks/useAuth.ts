import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await fetchApi('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const data = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    return data;
  };

  const signup = async (email: string, password: string, name?: string) => {
    const data = await fetchApi('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await fetchApi('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return { user, loading, login, signup, logout, checkAuth };
}
