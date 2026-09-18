import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { AnimatePresence } from 'framer-motion';

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

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflow: 'hidden' }}>
        <MobileNav />
        <Box component="main" sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/promos" element={<Promos />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/broadcast" element={<Broadcast />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AnimatedRoutes />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
