import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box, IconButton, Paper } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Settings, Menu, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const bottomTabs = [
  { to: '/', label: 'Home', icon: <Dashboard /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard /> },
  { to: '/players', label: 'Players', icon: <People /> },
];

const moreItems = [
  { to: '/tasks', label: 'Tasks', icon: <Assignment /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign /> },
  { to: '/settings', label: 'Settings', icon: <Settings /> },
];

export default function MobileNav() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/payments': return 'Payments';
      case '/players': return 'Players';
      case '/tasks': return 'Tasks';
      case '/promos': return 'Promos';
      case '/broadcast': return 'Broadcast';
      case '/settings': return 'Settings';
      default: return 'Admin';
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
        bgcolor: 'rgba(248, 250, 252, 0.85)',
        backdropFilter: 'blur(12px)',
      }}>
        <IconButton onClick={() => setIsDrawerOpen(true)} edge="start" sx={{ color: 'text.primary' }}>
          <Menu />
        </IconButton>
        <Typography variant="h6">{getPageTitle()}</Typography>
        <Box sx={{ width: 40 }} />
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
                '& .MuiBottomNavigationAction-label': { fontWeight: 700, mt: 0.5 },
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
        PaperProps={{ sx: { width: 280, p: 2, borderTopRightRadius: 24, borderBottomRightRadius: 24 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pl: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Menu</Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ bgcolor: 'rgba(15, 23, 42, 0.04)' }}>
            <Close />
          </IconButton>
        </Box>
        <List>
          {moreItems.map((item) => (
            <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => setIsDrawerOpen(false)}
                style={({ isActive }) => ({
                  borderRadius: '16px',
                  backgroundColor: isActive ? 'rgba(15, 23, 42, 0.04)' : 'transparent',
                  color: isActive ? '#0f172a' : '#64748b',
                })}
                sx={{ py: 1.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}
