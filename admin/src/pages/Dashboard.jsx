import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Grid, Skeleton } from '@mui/material';
import { People, CreditCard, Timeline, ArrowOutward } from '@mui/icons-material';
import AnimatedPage from '../components/AnimatedPage';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher);

  const stats = [
    { label: 'Total Players', value: data?.totalPlayers, icon: <People />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Deposits', value: data?.totalDeposits ? data.totalDeposits + ' ETB' : null, icon: <CreditCard />, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Total Withdrawals', value: data?.totalWithdrawals ? data.totalWithdrawals + ' ETB' : null, icon: <Timeline />, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Active Rounds', value: data?.activeRounds, icon: <ArrowOutward />, color: '#d946ef', bg: '#fdf4ff' },
  ];

  return (
    <AnimatedPage>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3">Overview</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Platform statistics and live metrics.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: '16px', 
                  backgroundColor: stat.bg, 
                  color: stat.color,
                  display: 'flex'
                }}>
                  {stat.icon}
                </Box>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width="60%" height={40} sx={{ mt: 1 }} />
                ) : (
                  <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {stat.value || '0'}
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </AnimatedPage>
  );
}
