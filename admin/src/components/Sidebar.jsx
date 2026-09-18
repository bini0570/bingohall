import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, Divider } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Logout } from '@mui/icons-material';
import { useAuth } from '../AuthContext';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: <Dashboard /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard /> },
  { to: '/players', label: 'Players', icon: <People /> },
  { to: '/tasks', label: 'Tasks', icon: <Assignment /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign /> },
];

export default function Sidebar() {
  const location = useLocation();
  const { setToken } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setToken(null);
    }
  };

  return (
    <Box sx={{
      display: { xs: 'none', md: 'flex' },
      width: 250,
      flexShrink: 0
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: 250,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 'bold' }}>B</Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>Bingo Admin</Typography>
            <Typography variant="caption" color="text.secondary">Management System</Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />

        <List sx={{ px: 2, flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  sx={{
                    borderRadius: '8px',
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    color: isActive ? 'primary.main' : 'text.primary',
                    '&:hover': {
                      bgcolor: isActive ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ p: 2 }}>
          <List disablePadding>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: '8px',
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Box>
  );
}
