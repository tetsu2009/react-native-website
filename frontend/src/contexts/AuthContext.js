import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('reality_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configure axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      getCurrentUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const getCurrentUser = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to get current user:', error);
      logout(); // Invalid token, logout user
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password
      });

      const { access_token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('reality_token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API}/auth/register`, userData);
      
      const { access_token, user: newUser } = response.data;
      
      // Store token
      localStorage.setItem('reality_token', access_token);
      setToken(access_token);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Erreur d'inscription";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('reality_token');
    setToken(null);
    setUser(null);
    setError(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put(`${API}/auth/profile`, profileData);
      setUser(response.data);
      
      return { success: true, user: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erreur de mise à jour';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};