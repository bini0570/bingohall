import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Settings, Logout } from '@mui/icons-material';
import { useAuth } from '../AuthContext';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: <Dashboard fontSize="small" /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard fontSize="small" /> },
  { to: '/players', label: 'Players', icon: <People fontSize="small" /> },
  { to: '/tasks', label: 'Tasks', icon: <Assignment fontSize="small" /> },
  { to: '/promos', label: 'Promo', icon: <CardGiftcard fontSize="small" /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <Box sx={{
      display: { xs: 'none', md: 'flex' },
      width: 260,
      flexShrink: 0
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: 260,
        bgcolor: '#0B1121', // Dark navy
        color: '#ffffff',
        position: 'fixed',
        top: 0,
        left: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
      }}>
        {/* Logo Area */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ 
            bgcolor: '#6366f1', // Indigo primary
            color: 'white',
            width: 36, height: 36, 
            borderRadius: '8px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.2rem',
            boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
          }}>
            B
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>Bingo X</Typography>
        </Box>
        
        {/* Navigation */}
        <List sx={{ px: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <ListItem key={item.to} disablePadding>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  sx={{
                    borderRadius: '10px',
                    py: 1.2,
                    bgcolor: isActive ? '#6366f1' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isActive ? '#4f46e5' : 'rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontWeight: isActive ? 600 : 500, fontSize: '0.95rem' }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          <Box sx={{ flexGrow: 1 }} />
          
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/settings"
              sx={{
                borderRadius: '10px',
                py: 1.2,
                color: location.pathname === '/settings' ? '#ffffff' : '#94a3b8',
                bgcolor: location.pathname === '/settings' ? '#6366f1' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#ffffff' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '10px',
                py: 1.2,
                color: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
}
