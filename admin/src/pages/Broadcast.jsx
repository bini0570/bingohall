import React, { useState } from 'react';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField } from '@mui/material';
import { Campaign, Send } from '@mui/icons-material';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await axios.post('/api/admin/broadcast', { message });
      toast.success('Broadcast sent successfully!');
      setMessage('');
    } catch (err) {
      toast.error('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: { xs: 2, md: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ 
            width: 80, height: 80, 
            bgcolor: 'rgba(79, 70, 229, 0.1)', 
            color: 'secondary.main', 
            borderRadius: '24px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            mx: 'auto', mb: 3 
          }}>
            <Campaign sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h3">Broadcast Message</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
            Send a global message to all players. It will appear on their dashboard immediately.
          </Typography>
        </Box>

        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <form onSubmit={handleSend}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Type your announcement here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.02)',
                }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              disabled={loading || !message.trim()}
              startIcon={<Send />}
              sx={{ py: 2, fontSize: '1.1rem' }}
            >
              {loading ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </form>
        </Card>
      </Box>
    </AnimatedPage>
  );
}
