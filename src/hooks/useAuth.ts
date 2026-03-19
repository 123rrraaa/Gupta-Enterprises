import { useState, useEffect } from 'react';
import { User } from '@/types/product';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem('water-current-user');
    if (currentUser) {
      setUser(JSON.parse(currentUser));
      setIsAuthenticated(true);
    }
  }, []);

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (response.status === 409) {
        return { success: false, message: 'Email already registered' };
      }

      if (response.ok) {
        const newUser = await response.json();
        localStorage.setItem('water-current-user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
        return { success: true, message: 'Account created successfully!' };
      } else {
        return { success: false, message: 'Failed to create account' };
      }
    } catch (error) {
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('http://localhost:5000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.status === 401) {
        return { success: false, message: 'Invalid email or password' };
      }

      if (response.ok) {
        const foundUser = await response.json();
        setUser(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem('water-current-user', JSON.stringify(foundUser));
        return { success: true, message: 'Login successful!' };
      } else {
        return { success: false, message: 'Login failed' };
      }
    } catch (error) {
      return { success: false, message: 'Unable to connect to server' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('water-current-user');
  };

  return { user, isAuthenticated, signup, login, logout };
};
