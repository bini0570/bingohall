import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField, Stack, Collapse, Switch } from '@mui/material';
import { Settings as SettingsIcon, VpnKey, Logout, ExpandMore, ExpandLess } from '@mui/icons-material';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';

export default function Settings() {
  const { setToken } = useAuth();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      setToken(null);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new) return;
    
    setLoading(true);
    try {
      await axios.post('/api/admin/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '' });
      setIsPasswordOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <Box sx={{ mb: 4, maxWidth: 600 }}>
        <Typography variant="h3">Settings</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Manage your admin preferences and account
        </Typography>
      </Box>

      <Stack spacing={3} sx={{ maxWidth: 600 }}>
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box 
            onClick={() => setIsPasswordOpen(!isPasswordOpen)}
            sx={{ 
              p: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              bgcolor: isPasswordOpen ? 'rgba(15, 23, 42, 0.02)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.02)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '12px', display: 'flex' }}>
                <VpnKey />
              </Box>
              <Box>
                <Typography variant="subtitle1">Change Password</Typography>
                <Typography variant="body2" color="text.secondary">Update your admin login password</Typography>
              </Box>
            </Box>
            {isPasswordOpen ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
          </Box>
          
          <Collapse in={isPasswordOpen}>
            <Box component="form" onSubmit={handlePasswordChange} sx={{ p: 3, pt: 0, borderTop: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={2} sx={{ mt: 3 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                  required
                />
                <TextField
                  label="New Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  required
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={loading || !passwords.current || !passwords.new}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </Stack>
            </Box>
          </Collapse>
        </Card>

        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: '12px', display: 'flex' }}>
                <Logout />
              </Box>
              <Box>
                <Typography variant="subtitle1">Sign Out</Typography>
                <Typography variant="body2" color="text.secondary">Securely log out of the admin panel</Typography>
              </Box>
            </Box>
            <Button variant="outlined" color="error" onClick={handleLogout} sx={{ borderRadius: '12px' }}>
              Logout
            </Button>
          </Box>
        </Card>
      </Stack>
    </AnimatedPage>
  );
}
