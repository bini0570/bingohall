import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Button, TextField, InputAdornment, Avatar, Chip, Stack } from '@mui/material';
import { Search, Block, CheckCircle, ArrowBack } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Players() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { data: users, error, isLoading, mutate } = useSWR(query ? '/api/admin/users?search=' + encodeURIComponent(query) : null, fetcher);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setQuery('');
      return;
    }
    setQuery(searchTerm);
  };

  const handleBanToggle = async (user) => {
    try {
      const action = user.is_banned ? 'unban' : 'ban';
      if (!window.confirm('Are you sure you want to ' + action + ' ' + user.username + '?')) return;
      
      const updatedUser = { ...user, is_banned: user.is_banned ? 0 : 1 };
      
      if (selectedPlayer?.id === user.id) setSelectedPlayer(updatedUser);
      if (users) mutate(users.map(u => u.id === user.id ? updatedUser : u), false);

      await axios.post('/api/admin/users/' + user.id + '/ban');
      toast.success('User ' + action + 'ed successfully');
      mutate();
    } catch (err) {
      toast.error('Failed to update user status');
      mutate();
    }
  };

  if (selectedPlayer) {
    return (
      <AnimatedPage>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => setSelectedPlayer(null)} 
            sx={{ mb: 3, color: 'text.secondary' }}
          >
            Back to Search
          </Button>
          
          <Card sx={{ p: { xs: 3, md: 5 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { md: 'center' } }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'secondary.main', fontSize: '2rem', fontWeight: 800 }}>
                {selectedPlayer.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h3">{selectedPlayer.username}</Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                  ID: {selectedPlayer.id} &bull; Phone: {selectedPlayer.phone_number}
                </Typography>
              </Box>
              <Box>
                <Chip 
                  label={selectedPlayer.is_banned ? 'BANNED' : 'ACTIVE'} 
                  color={selectedPlayer.is_banned ? 'error' : 'success'}
                  sx={{ fontWeight: 800, borderRadius: '12px', px: 1 }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2.5, mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ flex: 1, p: 2.5, bgcolor: 'background.default', borderRadius: '20px' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>Main Balance</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{selectedPlayer.balance} ETB</Typography>
              </Box>
              <Box sx={{ flex: 1, p: 2.5, bgcolor: 'background.default', borderRadius: '20px' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>Withdrawable</Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>{selectedPlayer.withdrawable_balance || 0} ETB</Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Admin Actions</Typography>
              <Button 
                variant="contained" 
                color={selectedPlayer.is_banned ? "primary" : "error"}
                size="large"
                startIcon={selectedPlayer.is_banned ? <CheckCircle /> : <Block />}
                onClick={() => handleBanToggle(selectedPlayer)}
                fullWidth={false}
              >
                {selectedPlayer.is_banned ? 'Unban Player' : 'Ban Player'}
              </Button>
            </Box>
          </Card>
        </Box>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', py: 4 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Player Search</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
          Find players by their ID, username, or phone number to manage their accounts.
        </Typography>
      </Box>

      <Card sx={{ p: 2, maxWidth: 600, mx: 'auto', borderRadius: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <TextField
            fullWidth
            placeholder="Search ID, phone, or username..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
            }}
          />
          <Button type="submit" variant="contained" color="primary" disabled={isLoading} sx={{ px: 4 }}>
            Search
          </Button>
        </form>
      </Card>

      <Box sx={{ mt: 6, maxWidth: 800, mx: 'auto' }}>
        {query && !isLoading && users?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No player found for "{query}"</Typography>
          </Box>
        )}

        {query && users?.length > 0 && (
          <Stack spacing={2}>
            {users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  sx={{ 
                    p: 2.5, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2.5,
                    cursor: 'pointer',
                    opacity: user.is_banned ? 0.6 : 1,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' },
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => setSelectedPlayer(user)}
                >
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'background.default', color: 'text.secondary', fontWeight: 800 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {user.id} &bull; {user.phone_number}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">{user.balance} ETB</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Balance</Typography>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </Stack>
        )}
      </Box>
    </AnimatedPage>
  );
}
