/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import SafetyHub from './pages/SafetyHub';
import StrikeHistory from './pages/StrikeHistory';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserManagement from './pages/AdminUserManagement';
import NewPost from './pages/NewPost';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/home" /> : <Login onLogin={login} />} />
        <Route path="/register" element={user ? <Navigate to="/home" /> : <Register onLogin={login} />} />
        <Route path="/admin/login" element={user ? <Navigate to="/admin/dashboard" /> : <AdminLogin onLogin={login} />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={user ? <Home user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile user={user} onLogout={logout} /> : <Navigate to="/login" />} />
        <Route path="/safety" element={user ? <SafetyHub user={user} /> : <Navigate to="/login" />} />
        <Route path="/strikes" element={user ? <StrikeHistory user={user} /> : <Navigate to="/login" />} />
        <Route path="/new-post" element={user ? <NewPost user={user} /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/admin/login" />} />
        <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUserManagement /> : <Navigate to="/admin/login" />} />
      </Routes>
    </Router>
  );
}
