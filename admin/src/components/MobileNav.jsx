import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, IconButton, Paper, Divider } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Logout, Menu, Close, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useThemeMode } from '../ThemeContext';

const bottomTabs = [
  { to: '/', label: 'Home', icon: <Dashboard /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard /> },
  { to: '/players', label: 'Players', icon: <People /> },
];

const moreItems = [
  { to: '/tasks', label: 'Tasks', icon: <Assignment /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign /> },
];

export default function MobileNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/payments': return 'Payments';
      case '/players': return 'Players';
      case '/tasks': return 'Tasks';
      case '/promos': return 'Promos';
      case '/broadcast': return 'Broadcast';
      default: return 'Admin';
    }
  };

  const handleLogout = () => {
    setIsDrawerOpen(false);
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <>
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 2, 
        position: 'sticky', 
        top: 0, 
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <IconButton onClick={() => setIsDrawerOpen(true)} edge="start" sx={{ color: 'text.primary' }}>
          <Menu />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{getPageTitle()}</Typography>
        <IconButton onClick={toggleTheme} sx={{ color: 'text.primary' }}>
          {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Box>

      <Paper 
        sx={{ 
          display: { xs: 'block', md: 'none' }, 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1100,
          pb: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid',
          borderColor: 'divider'
        }} 
        elevation={0}
      >
        <BottomNavigation value={location.pathname} onChange={(e, val) => navigate(val)}>
          {bottomTabs.map(tab => (
            <BottomNavigationAction 
              key={tab.to} 
              label={tab.label} 
              value={tab.to} 
              icon={tab.icon} 
              sx={{ color: location.pathname === tab.to ? 'primary.main' : 'text.secondary' }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, bgcolor: '#0B1121', color: '#ffffff' } }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: '#6366f1', color: 'white',
              width: 36, height: 36, borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', fontSize: '1.2rem',
              boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)'
            }}>
              B
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Bingo X</Typography>
          </Box>
          <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ color: '#94a3b8' }}>
            <Close />
          </IconButton>
        </Box>
        <List sx={{ px: 2, flex: 1 }}>
          {moreItems.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => setIsDrawerOpen(false)}
                sx={{
                  borderRadius: '10px',
                  py: 1.2,
                  bgcolor: location.pathname === item.to ? '#6366f1' : 'transparent',
                  color: location.pathname === item.to ? '#ffffff' : '#94a3b8',
                  '&:hover': { bgcolor: location.pathname === item.to ? '#4f46e5' : 'rgba(255,255,255,0.05)', color: '#ffffff' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ p: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '10px',
                py: 1.2,
                color: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239,68,68,0.1)', color: '#f87171' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><Logout fontSize="small" /></ListItemIcon>
              <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }} />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
}
