import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField, Select, MenuItem, Stack, FormControl, InputLabel, Chip, Grid } from '@mui/material';
import { Add, PowerSettingsNew, Delete, EmojiEvents } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Tasks() {
  const { data: tasks, error, isLoading, mutate } = useSWR('/api/admin/tasks', fetcher);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Telegram',
    telegram_link: '',
    button_name: 'Join Channel',
    required_invites: 5,
    required_games: 10,
    reward: '',
    target: 'All Players'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tasks', formData);
      toast.success('Task created successfully');
      setCreating(false);
      mutate();
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'active' ? 'disabled' : 'active';
      mutate(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t), false);
      await axios.put('/api/admin/tasks/' + task.id + '/status', { status: newStatus });
      mutate();
    } catch (err) {
      toast.error('Failed to update task');
      mutate();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      mutate(tasks.filter(t => t.id !== id), false);
      await axios.delete('/api/admin/tasks/' + id);
      toast.success('Task deleted');
      mutate();
    } catch (err) {
      toast.error('Failed to delete task');
      mutate();
    }
  };

  return (
    <AnimatedPage>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3">Tasks</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>Manage reward campaigns</Typography>
        </Box>
        {!creating && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>
            Create Task
          </Button>
        )}
      </Box>

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card sx={{ p: { xs: 3, md: 4 }, mb: 4, borderTop: '4px solid #4f46e5' }}>
              <Typography variant="h5" sx={{ mb: 4 }}>Create New Task</Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Task Type</InputLabel>
                      <Select
                        label="Task Type"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                      >
                        <MenuItem value="Telegram">Telegram</MenuItem>
                        <MenuItem value="Invite">Invite</MenuItem>
                        <MenuItem value="Game Played">Game Played</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth required label="Task Title"
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </Grid>
                  {formData.type === 'Telegram' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth required type="url" label="Telegram Link"
                          value={formData.telegram_link} onChange={e => setFormData({...formData, telegram_link: e.target.value})}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth required label="Button Name"
                          value={formData.button_name} onChange={e => setFormData({...formData, button_name: e.target.value})}
                        />
                      </Grid>
                    </>
                  )}
                  {formData.type === 'Invite' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth required type="number" inputProps={{ min: 1 }} label="Required Invites"
                        value={formData.required_invites} onChange={e => setFormData({...formData, required_invites: e.target.value})}
                      />
                    </Grid>
                  )}
                  {formData.type === 'Game Played' && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth required type="number" inputProps={{ min: 1 }} label="Required Games"
                        value={formData.required_games} onChange={e => setFormData({...formData, required_games: e.target.value})}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth required type="number" inputProps={{ min: 0, step: 0.1 }} label="Reward (ETB)"
                      value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Target Audience</InputLabel>
                      <Select
                        label="Target Audience"
                        value={formData.target}
                        onChange={e => setFormData({...formData, target: e.target.value})}
                      >
                        <MenuItem value="All Players">All Players</MenuItem>
                        <MenuItem value="New Players">New Players</MenuItem>
                        <MenuItem value="Active Players">Active Players</MenuItem>
                        <MenuItem value="VIP Depositors">VIP Depositors</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setCreating(false)} color="inherit">Cancel</Button>
                  <Button type="submit" variant="contained" color="secondary">Create Task</Button>
                </Box>
              </Box>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={3}>
        {tasks?.map((task, i) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ height: '100%' }}>
              <Card sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                opacity: task.status === 'active' ? 1 : 0.6,
                transform: task.status === 'active' ? 'none' : 'scale(0.98)',
                transition: 'all 0.2s'
              }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Chip label={task.type || 'Telegram'} color="primary" sx={{ borderRadius: '8px', fontWeight: 800 }} />
                    <Typography variant="h5" color="secondary.main" sx={{ fontWeight: 900 }}>+{task.reward} ETB</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 800 }}>{task.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {task.type === 'Telegram' && task.telegram_link}
                    {task.type === 'Invite' && 'Requires ' + (task.required_invites || 5) + ' invites'}
                    {task.type === 'Game Played' && 'Requires ' + (task.required_games || 10) + ' games'}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Target</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{task.target}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Claims</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{task.claim_count || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant={task.status === 'active' ? 'outlined' : 'contained'} 
                    color="primary" 
                    fullWidth 
                    startIcon={<PowerSettingsNew />}
                    onClick={() => handleToggleStatus(task)}
                  >
                    {task.status === 'active' ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="outlined" color="error" sx={{ minWidth: '48px', px: 0 }} onClick={() => handleDelete(task.id)}>
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
