import React, { useState } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, Avatar, 
  CircularProgress, Button, IconButton, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Chip
} from '@mui/material';
import { 
  People, ArrowUpward, ArrowDownward, 
  Language, Add, Refresh, Assignment, CardGiftcard
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const fetcher = async (url) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const mockChartData = [
  { name: 'Mon', deposits: 4000, withdrawals: 2400, revenue: 1600 },
  { name: 'Tue', deposits: 3000, withdrawals: 1398, revenue: 1602 },
  { name: 'Wed', deposits: 2000, withdrawals: 9800, revenue: -7800 },
  { name: 'Thu', deposits: 2780, withdrawals: 3908, revenue: -1128 },
  { name: 'Fri', deposits: 1890, withdrawals: 4800, revenue: -2910 },
  { name: 'Sat', deposits: 2390, withdrawals: 3800, revenue: -1410 },
  { name: 'Sun', deposits: 3490, withdrawals: 4300, revenue: -810 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher);
  const [period, setPeriod] = useState('This Month');
  const [chartPeriod, setChartPeriod] = useState('Last 7 Days');

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error || !data) return <Box sx={{ p: 4, color: 'error.main' }}>Error loading dashboard data.</Box>;

  const recentPayments = (data.recentActivities || []).filter(a => a.type === 'deposit' || a.type === 'withdrawal').slice(0, 5);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', pb: 10 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Overview of Bingo X system performance.
          </Typography>
        </Box>
        <Select
          size="small"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          sx={{ bgcolor: 'background.paper', borderRadius: '8px', minWidth: 140 }}
        >
          <MenuItem value="Today">Today</MenuItem>
          <MenuItem value="This Week">This Week</MenuItem>
          <MenuItem value="This Month">This Month</MenuItem>
        </Select>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Total Players</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.totalUsers}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 48, height: 48, borderRadius: '12px' }}>
                  <People />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                12 Today's Registrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Online Players</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{Math.floor(data.totalUsers * 0.15) || 5}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', width: 48, height: 48, borderRadius: '12px' }}>
                  <Language />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                8% increase
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Total Deposits</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.totalDeposits}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 48, height: 48, borderRadius: '12px' }}>
                  <ArrowDownward />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                15% this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Total Withdrawals</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>{data.totalWithdrawals}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', width: 48, height: 48, borderRadius: '12px' }}>
                  <ArrowUpward />
                </Avatar>
              </Box>
              <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                5% this week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Main Analytics Area */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Revenue Overview</Typography>
                <Select
                  size="small"
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  sx={{ borderRadius: '8px', minWidth: 130, height: 36 }}
                >
                  <MenuItem value="Last 7 Days">Last 7 Days</MenuItem>
                  <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                  <MenuItem value="This Year">This Year</MenuItem>
                </Select>
              </Box>
              <Box sx={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Area type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDeposits)" />
                    <Area type="monotone" dataKey="withdrawals" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdrawals)" />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        {/* Recent Payments Table */}
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Payments</Typography>
                <Button size="small" onClick={() => navigate('/payments')} sx={{ fontWeight: 600, color: '#6366f1' }}>View All</Button>
              </Box>
              
              <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="recent payments table">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>User</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Type</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Status</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayments.length > 0 ? (
                      recentPayments.map((row, index) => (
                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            {row.username || row.phone || 'Unknown'}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {row.type === 'deposit' ? <ArrowDownward sx={{ color: '#10b981', fontSize: 18 }} /> : <ArrowUpward sx={{ color: '#f43f5e', fontSize: 18 }} />}
                              <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>{row.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            {row.amount} ETB
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <Chip 
                              label="Completed" 
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
                                fontWeight: 700, borderRadius: '6px' 
                              }} 
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            {new Date(row.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No recent payments found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        </Grid>

        {/* Right Sidebar Area */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Payment Status Section */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Payment Status</Typography>
                  
                  <Box 
                    onClick={() => navigate('/payments')}
                    sx={{ 
                      p: 2, mb: 2, borderRadius: '12px', bgcolor: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                      <Typography sx={{ fontWeight: 600 }}>Pending Deposits</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#f59e0b' }}>3</Typography>
                  </Box>

                  <Box 
                    onClick={() => navigate('/payments')}
                    sx={{ 
                      p: 2, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
                      <Typography sx={{ fontWeight: 600 }}>Pending Withdrawals</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#ef4444' }}>5</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quick Actions</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button 
                        fullWidth variant="outlined" 
                        onClick={() => navigate('/payments')}
                        sx={{ borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, borderColor: 'rgba(0,0,0,0.1)', color: 'text.primary', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.2)' } }}
                      >
                        <ArrowDownward sx={{ color: '#10b981' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Deposit Req</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button 
                        fullWidth variant="outlined" 
                        onClick={() => navigate('/payments')}
                        sx={{ borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, borderColor: 'rgba(0,0,0,0.1)', color: 'text.primary', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.2)' } }}
                      >
                        <ArrowUpward sx={{ color: '#f43f5e' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Withdraw Req</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button 
                        fullWidth variant="outlined" 
                        onClick={() => navigate('/tasks')}
                        sx={{ borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, borderColor: 'rgba(0,0,0,0.1)', color: 'text.primary', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.2)' } }}
                      >
                        <Assignment sx={{ color: '#6366f1' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Create Task</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button 
                        fullWidth variant="outlined" 
                        onClick={() => navigate('/promos')}
                        sx={{ borderRadius: '12px', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, borderColor: 'rgba(0,0,0,0.1)', color: 'text.primary', '&:hover': { bgcolor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.2)' } }}
                      >
                        <CardGiftcard sx={{ color: '#06b6d4' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Create Promo</Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

      </Grid>
    </Box>
  );
}
