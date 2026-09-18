import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CssBaseline, Box, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { ThemeModeProvider, useThemeMode } from './ThemeContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Tasks from './pages/Tasks';
import Promos from './pages/Promos';
import Payments from './pages/Payments';
import Broadcast from './pages/Broadcast';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

const ThemeToggle = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <IconButton onClick={toggleTheme} sx={{ color: 'text.primary', ml: 'auto' }}>
      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <MobileNav />
        <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mb: 2 }}>
            <ThemeToggle />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default function App() {
  return (
    <ThemeModeProvider>
      <CssBaseline />
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
