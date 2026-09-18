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
        PaperProps={{ sx: { width: 260 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Menu</Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ flex: 1, p: 2 }}>
          {moreItems.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => setIsDrawerOpen(false)}
                sx={{
                  borderRadius: '8px',
                  bgcolor: location.pathname === item.to ? 'action.selected' : 'transparent',
                  color: location.pathname === item.to ? 'primary.main' : 'text.primary',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '8px',
                color: 'error.main',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><Logout /></ListItemIcon>
              <ListItemText primary="Sign Out" />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </>
  );
}
