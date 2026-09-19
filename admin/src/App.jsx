import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CssBaseline, Box, Fab } from '@mui/material';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { DarkMode, LightMode } from '@mui/icons-material';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Tasks from './pages/Tasks';
import Promos from './pages/Promos';
import Payments from './pages/Payments';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';
import FloatingNav from './components/FloatingNav';
import MobileHeader from './components/MobileHeader';

const ThemeToggleFab = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Fab 
      onClick={toggleTheme} 
      size="small"
      sx={{ 
        position: 'fixed', bottom: 20, right: 20, zIndex: 1200, 
        bgcolor: mode === 'light' ? '#FFFFFF' : '#17181D',
        color: 'text.primary',
        border: mode === 'light' ? '1px solid #E4E5EA' : '1px solid #2A2C33',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
    </Fab>
  );
};

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  
  useEffect(() => {
    if (!token) return;
    const socketURL = import.meta.env.VITE_API_URL || '';
    const socket = io(socketURL);
    
    socket.on('admin_notification', (data) => {
      toast(data.message, {
        icon: data.type === 'deposit' ? '💰' : data.type === 'withdrawal' ? '💸' : '🔔',
        style: {
          borderRadius: '12px',
          background: '#17181D',
          color: '#F5F6F8',
          border: '1px solid #2A2C33'
        },
      });
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    });
    
    return () => socket.disconnect();
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', pb: 12 }}>
      <MobileHeader />
      <Box component="main" sx={{ px: { xs: 2, md: 4 } }}>
        {children}
      </Box>
      <FloatingNav />
      <ThemeToggleFab />
    </Box>
  );
};

export default function App() {
  return (
    <ThemeModeProvider>
      <CssBaseline />
      <Toaster position="top-center" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/players" element={<Players />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/promos" element={<Promos />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/broadcast" element={<Broadcast />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}
