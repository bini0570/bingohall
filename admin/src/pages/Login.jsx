import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField } from '@mui/material';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', { username, password });
      setToken(res.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Card sx={{ p: { xs: 4, sm: 5 }, borderRadius: '32px' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ 
              width: 56, height: 56, 
              background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontSize: '1.5rem',
              mx: 'auto', mb: 2
            }}>
              B
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>Admin Login</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Sign in to manage the platform</Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={e => setUsername(e.target.value)}
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 4 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>
              Sign In
            </Button>
          </form>
        </Card>
      </motion.div>
    </Box>
  );
}
