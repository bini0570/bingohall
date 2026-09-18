import React from 'react';
import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { Dashboard, CreditCard, People, Assignment, CardGiftcard, Campaign, Settings } from '@mui/icons-material';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <Dashboard /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard /> },
  { to: '/players', label: 'Players', icon: <People /> },
  { to: '/tasks', label: 'Tasks', icon: <Assignment /> },
  { to: '/promos', label: 'Promos', icon: <CardGiftcard /> },
  { to: '/broadcast', label: 'Broadcast', icon: <Campaign /> },
  { to: '/settings', label: 'Settings', icon: <Settings /> },
];

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': { 
          position: 'relative',
          width: 280, 
          boxSizing: 'border-box',
          borderRight: '1px solid rgba(15, 23, 42, 0.06)',
          bgcolor: 'background.default',
        },
      }}
    >
      <Box sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 44, height: 44, 
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 900, fontSize: '1.25rem'
        }}>
          B
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>Bingo</Typography>
      </Box>
      
      <List sx={{ px: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              component={NavLink}
              to={item.to}
              style={({ isActive }) => ({
                borderRadius: '16px',
                backgroundColor: isActive ? 'rgba(15, 23, 42, 0.04)' : 'transparent',
                color: isActive ? '#0f172a' : '#64748b',
              })}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(15, 23, 42, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.95rem' }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
