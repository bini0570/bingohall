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
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/login', { username, password });
      login(res.data.token);
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
        <Card sx={{ p: { xs: 3, sm: 4 }, borderRadius: '24px' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ 
              width: 56, height: 56, 
              background: '#5B5CE2',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontSize: '1.5rem',
              mx: 'auto', mb: 2,
              boxShadow: '0 8px 16px rgba(91,92,226,0.3)'
            }}>
              B
            </Box>
            <Typography variant="h2" sx={{ mb: 1 }}>Bingo X</Typography>
            <Typography variant="body1" color="text.secondary">Admin Control Center</Typography>
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
              sx={{ mb: 3 }}
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
