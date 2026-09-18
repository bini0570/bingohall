import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField, Stack, Chip, Grid } from '@mui/material';
import { Add, Delete, ContentCopy, PowerSettingsNew } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import { format } from 'date-fns';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Promos() {
  const { data: promos, error, isLoading, mutate } = useSWR('/api/admin/promos', fetcher);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ code: '', reward: '', max_uses: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/promos', formData);
      toast.success('Promo code created');
      setCreating(false);
      mutate();
    } catch (err) {
      toast.error('Failed to create promo code');
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === 'active' ? 'disabled' : 'active';
      mutate(promos.map(p => p.id === promo.id ? { ...p, status: newStatus } : p), false);
      await axios.put('/api/admin/promos/' + promo.id + '/status', { status: newStatus });
      mutate();
    } catch (err) {
      toast.error('Failed to update promo');
      mutate();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      mutate(promos.filter(p => p.id !== id), false);
      await axios.delete('/api/admin/promos/' + id);
      toast.success('Promo deleted');
      mutate();
    } catch (err) {
      toast.error('Failed to delete promo');
      mutate();
    }
  };

  return (
    <AnimatedPage>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3">Promo Codes</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>Manage bonus codes</Typography>
        </Box>
        {!creating && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>
            Create Code
          </Button>
        )}
      </Box>

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card sx={{ p: { xs: 3, md: 4 }, mb: 4, borderTop: '4px solid #4f46e5' }}>
              <Typography variant="h5" sx={{ mb: 4 }}>Create Promo Code</Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth required label="Promo Code"
                      value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      helperText="e.g. WELCOME50"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth required type="number" inputProps={{ min: 0, step: 0.1 }} label="Reward (ETB)"
                      value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth required type="number" inputProps={{ min: 1 }} label="Max Uses"
                      value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setCreating(false)} color="inherit">Cancel</Button>
                  <Button type="submit" variant="contained" color="secondary">Create Code</Button>
                </Box>
              </Box>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={3}>
        {promos?.map((promo, i) => (
          <Grid item xs={12} md={6} lg={4} key={promo.id}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ height: '100%' }}>
              <Card sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                opacity: promo.status === 'active' ? 1 : 0.6,
                transform: promo.status === 'active' ? 'none' : 'scale(0.98)',
                transition: 'all 0.2s'
              }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ 
                      px: 2, py: 1, 
                      bgcolor: 'rgba(15, 23, 42, 0.04)', 
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', gap: 1
                    }}>
                      <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.1em' }}>
                        {promo.code}
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 900 }}>+{promo.reward} ETB</Typography>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 4, mt: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Used / Max</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{promo.current_uses} / {promo.max_uses}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Created</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{format(new Date(promo.created_at), 'MMM d, yyyy')}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant={promo.status === 'active' ? 'outlined' : 'contained'} 
                    color="primary" 
                    fullWidth 
                    startIcon={<PowerSettingsNew />}
                    onClick={() => handleToggleStatus(promo)}
                  >
                    {promo.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outlined" color="error" sx={{ minWidth: '48px', px: 0 }} onClick={() => handleDelete(promo.id)}>
                    <Delete />
                  </Button>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </AnimatedPage>
  );
}
