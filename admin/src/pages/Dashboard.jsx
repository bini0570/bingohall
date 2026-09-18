import React from 'react';
import useSWR from 'swr';
import { Box, Typography, Grid, Card, CardContent, Avatar, List, ListItem, ListItemAvatar, ListItemText, CircularProgress, Divider } from '@mui/material';
import { People, AccountBalanceWallet, ArrowUpward, ArrowDownward, CheckCircle, SwapHoriz } from '@mui/icons-material';

const fetcher = (url) => fetch(url, { headers: { Authorization: \Bearer \\ } }).then(r => r.json());

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error || !data) return <Box sx={{ p: 4, color: 'error.main' }}>Error loading dashboard data.</Box>;

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 10 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Dashboard Overview</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                <People sx={{ color: 'primary.main' }} />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="body2">Total Players</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{data.totalUsers}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                <ArrowDownward sx={{ color: 'success.main' }} />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="body2">Total Deposits</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{data.totalDeposits} <Typography component="span" variant="body2">ETB</Typography></Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'error.light', width: 56, height: 56 }}>
                <ArrowUpward sx={{ color: 'error.main' }} />
              </Avatar>
              <Box>
                <Typography color="text.secondary" variant="body2">Total Withdrawals</Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{data.totalWithdrawals} <Typography component="span" variant="body2">ETB</Typography></Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Recent Activities</Typography>
      <Card>
        <List disablePadding>
          {data.recentActivities?.map((activity, index) => (
            <React.Fragment key={activity.id + activity.type}>
              <ListItem sx={{ py: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: activity.type === 'deposit' ? 'success.light' : activity.type === 'withdrawal' ? 'error.light' : 'primary.light',
                    color: activity.type === 'deposit' ? 'success.main' : activity.type === 'withdrawal' ? 'error.main' : 'primary.main'
                  }}>
                    {activity.type === 'deposit' ? <ArrowDownward /> : activity.type === 'withdrawal' ? <ArrowUpward /> : <CheckCircle />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {activity.type === 'deposit' ? 'Deposit' : activity.type === 'withdrawal' ? 'Withdrawal' : 'New Registration'}
                      </Typography>
                      {activity.amount && (
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: activity.type === 'deposit' ? 'success.main' : 'error.main' }}>
                          {activity.type === 'deposit' ? '+' : '-'}{activity.amount} ETB
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {activity.username} • {activity.phone || activity.telegram_id || ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < data.recentActivities.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {(!data.recentActivities || data.recentActivities.length === 0) && (
            <ListItem><ListItemText primary="No recent activities" /></ListItem>
          )}
        </List>
      </Card>
    </Box>
  );
}
