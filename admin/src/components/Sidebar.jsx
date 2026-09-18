import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Logout } from '@mui/icons-material';
import { useAuth } from '../AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <Dashboard fontSize="small" /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard fontSize="small" /> },
  { to: '/players', label: 'Players', icon: <People fontSize="small" /> },
  { to: '/tasks', label: 'Tasks', icon: <Assignment fontSize="small" /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard fontSize="small" /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign fontSize="small" /> },
];

export default function Sidebar() {
  const { setToken } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      setToken(null);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': { 
          position: 'relative',
          width: 240, // More compact sidebar
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(15, 23, 42, 0.06)',
          bgcolor: 'background.default',
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 32, height: 32, 
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '1rem'
        }}>
          B
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Bingo</Typography>
      </Box>
      
      <List sx={{ px: 2, flex: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.to}
              style={({ isActive }) => ({
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
              })}
              sx={{
                py: 1,
                minHeight: 36,
                '&:hover': {
                  backgroundColor: 'rgba(15, 23, 42, 0.05)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(15, 23, 42, 0.06)' }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '10px',
              color: '#ef4444',
              py: 1,
              minHeight: 36,
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Sign Out" 
              primaryTypographyProps={{ fontWeight: 700, fontSize: '0.85rem' }} 
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Drawer>
  );
}
