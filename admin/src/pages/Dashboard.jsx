import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Skeleton, Stack, Avatar } from '@mui/material';
import { People, CreditCard, Timeline, PersonAdd } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import AnimatedPage from '../components/AnimatedPage';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher);

  return (
    <AnimatedPage>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h3">Overview</Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
          Live wallet summary and recent events.
        </Typography>
      </Box>

      {/* Main Wallet Frame */}
      <Card sx={{ 
        p: { xs: 2.5, md: 3 }, 
        mb: 4, 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)'
      }}>
        {/* Total Players */}
        <Box sx={{ textAlign: 'center', mb: 3, pb: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ 
            width: 48, height: 48, 
            bgcolor: 'rgba(255,255,255,0.1)', 
            borderRadius: '16px', 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            mb: 1 
          }}>
            <People sx={{ color: '#60a5fa' }} />
          </Box>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
            Total Players
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width="40%" height={50} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
          ) : (
            <Typography variant="h2" sx={{ fontWeight: 900 }}>
              {data?.totalPlayers || '0'}
            </Typography>
          )}
        </Box>

        {/* Deposits and Withdrawals side-by-side */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <CreditCard fontSize="small" sx={{ color: '#34d399' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>TOTAL DEPOSITS</Typography>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" width="60%" height={30} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {data?.totalDeposits ? data.totalDeposits + ' ETB' : '0 ETB'}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ width: '1px', height: '40px', bgcolor: 'rgba(255,255,255,0.1)' }} />
          
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Timeline fontSize="small" sx={{ color: '#f87171' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>TOTAL WITHDRAWALS</Typography>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" width="60%" height={30} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {data?.totalWithdrawals ? data.totalWithdrawals + ' ETB' : '0 ETB'}
              </Typography>
            )}
          </Box>
        </Box>
      </Card>

      {/* Recent Activities */}
      <Typography variant="h5" sx={{ mb: 2 }}>Recent Activities</Typography>
      <Card sx={{ p: 0, borderRadius: '20px' }}>
        {isLoading && (
          <Box sx={{ p: 3 }}><Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} /></Box>
        )}
        {!isLoading && data?.recentActivities?.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No recent activities.</Typography>
          </Box>
        )}
        <Stack divider={<Box sx={{ height: '1px', bgcolor: 'divider' }} />}>
          {data?.recentActivities?.map((act, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: act.type === 'deposit' ? '#eef2ff' : act.type === 'withdrawal' ? '#fef2f2' : '#eff6ff', 
                color: act.type === 'deposit' ? '#4f46e5' : act.type === 'withdrawal' ? '#ef4444' : '#3b82f6',
                width: 40, height: 40
              }}>
                {act.type === 'deposit' ? <CreditCard fontSize="small" /> : act.type === 'withdrawal' ? <Timeline fontSize="small" /> : <PersonAdd fontSize="small" />}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {act.type === 'deposit' ? 'Deposit' : act.type === 'withdrawal' ? 'Withdrawal' : 'New Player'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <span style={{ fontWeight: 700 }}>{act.username}</span> 
                  {act.type === 'deposit' &&  deposited  ETB}
                  {act.type === 'withdrawal' &&  withdrew  ETB}
                  {act.type === 'registration' && ' joined the platform'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Card>
    </AnimatedPage>
  );
}
