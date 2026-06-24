import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const AuthContext = createContext(null);
let socket = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [unreadMsgs,  setUnreadMsgs]      = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      const u = JSON.parse(saved);
      setUser(u);
      connectSocket(u.id);
    }
    setLoading(false);
  }, []);

  const connectSocket = (userId) => {
    const serverUrl = import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
    socket = io(serverUrl);
    socket.emit('join', userId);
    socket.on('notification', () => setUnreadCount(n => n + 1));
    socket.on('new_message',  () => setUnreadMsgs(n => n + 1));
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.user.id);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.user.id);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) socket.disconnect();
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    setUnreadMsgs(0);
  };

  const updateUser = (u) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const fetchNotifications = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
    return data;
  };

  const markNotificationsRead = async () => {
    await api.put('/notifications/read');
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      notifications, unreadCount, fetchNotifications, markNotificationsRead, socket,
      unreadMsgs, clearUnreadMsgs: () => setUnreadMsgs(0)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
