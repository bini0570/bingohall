import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, IconButton, Paper, Divider } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Logout, Menu, Close, Brightness4, Brightness7 } from '@mui/icons-material';
import { useAuth } from '../AuthContext';
import { useThemeMode } from '../ThemeContext';

const bottomTabs = [
  { to: '/', label: 'Home', icon: <Dashboard fontSize="small" /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard fontSize="small" /> },
  { to: '/players', label: 'Players', icon: <People fontSize="small" /> },
];

const moreItems = [
  { to: '/tasks', label: 'Tasks', icon: <Assignment fontSize="small" /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard fontSize="small" /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign fontSize="small" /> },
];

export default function MobileNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setToken } = useAuth();
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
      setToken(null);
    }
  };

  return (
    <>
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        p: 1.5, 
        position: 'sticky', 
        top: 0, 
        zIndex: 1100,
        bgcolor: mode === 'light' ? 'rgba(248, 250, 252, 0.85)' : 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.04)' : '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        <IconButton onClick={() => setIsDrawerOpen(true)} edge="start" sx={{ color: 'text.primary', p: 1 }}>
          <Menu fontSize="small" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{getPageTitle()}</Typography>
        <IconButton onClick={toggleTheme} sx={{ color: 'text.primary', p: 1 }}>
          {mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
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
          pb: 'env(safe-area-inset-bottom)'
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
              sx={{ 
                '& .MuiBottomNavigationAction-label': { fontWeight: 700, mt: 0.5, fontSize: '0.65rem' },
                color: location.pathname === tab.to ? 'primary.main' : 'text.secondary'
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: 260, p: 2, borderTopRightRadius: 20, borderBottomRightRadius: 20 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pl: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Menu</Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ bgcolor: 'action.hover', p: 1 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <List sx={{ flex: 1 }}>
          {moreItems.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => setIsDrawerOpen(false)}
                style={({ isActive }) => ({
                  borderRadius: '12px',
                  backgroundColor: isActive ? 'action.selected' : 'transparent',
                  color: isActive ? 'text.primary' : 'text.secondary',
                })}
                sx={{ py: 1, minHeight: 40 }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 1 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '12px',
                color: '#ef4444',
                py: 1,
                minHeight: 40,
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.05)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}><Logout fontSize="small" /></ListItemIcon>
              <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
