import React, { useState } from 'react';
import useSWR from 'swr';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Avatar, 
  CircularProgress, Button, IconButton, Select, MenuItem,
  Divider, Paper
} from '@mui/material';
import { 
  People, ArrowUpward, ArrowDownward, 
  Language, Assignment, CardGiftcard, ChevronRight, ShowChart, MoreVert
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useThemeMode } from '../ThemeContext';

const fetcher = async (url) => {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const mockChartData = [
  { name: 'M', value: 1600 },
  { name: 'T', value: 2400 },
  { name: 'W', value: 1200 },
  { name: 'T', value: 3800 },
  { name: 'F', value: 2900 },
  { name: 'S', value: 3100 },
  { name: 'S', value: 4200 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, error, isLoading } = useSWR('/api/admin/dashboard', fetcher);
  const [period, setPeriod] = useState('This Week');
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress sx={{ color: '#5B5CE2' }} /></Box>;
  if (error || !data) return <Box sx={{ p: 4, color: 'error.main' }}>Error loading dashboard data.</Box>;

  const recentPayments = (data.recentActivities || []).filter(a => a.type === 'deposit' || a.type === 'withdrawal').slice(0, 4);

  const Surface = ({ children, sx = {}, onClick }) => (
    <Box 
      onClick={onClick}
      sx={{ 
        bgcolor: isLight ? '#FFFFFF' : '#17181D', 
        borderRadius: '24px',
        border: isLight ? '1px solid #E4E5EA' : '1px solid #2A2C33',
        p: 2.5,
        cursor: onClick ? 'pointer' : 'default',
        ...sx 
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto' }}>
      <Grid container spacing={2.5}>
        
        {/* Top Summary Block */}
        <Grid item xs={12} md={8}>
          <Surface sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Revenue</Typography>
                <Typography variant="h1" sx={{ mt: 0.5 }}>{(data.totalDeposits || 0).toLocaleString()} <Typography component="span" variant="h3" sx={{ color: 'text.secondary' }}>ETB</Typography></Typography>
              </Box>
              <Select
                size="small"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                sx={{ 
                  borderRadius: '12px', height: 36, fontSize: '13px', fontWeight: 600,
                  bgcolor: isLight ? 'rgba(21,22,26,0.04)' : 'rgba(245,246,248,0.04)',
                  '& fieldset': { border: 'none' }
                }}
              >
                <MenuItem value="Today">Today</MenuItem>
                <MenuItem value="This Week">This Week</MenuItem>
                <MenuItem value="This Month">This Month</MenuItem>
              </Select>
            </Box>
            
            <Box sx={{ flex: 1, minHeight: 180, width: '100%', ml: -2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5B5CE2" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#5B5CE2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isLight ? '#737780' : '#9699A3', fontSize: 12}} dy={10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isLight ? '#15161A' : '#F5F6F8', color: isLight ? '#FFF' : '#000' }}
                    itemStyle={{ color: isLight ? '#FFF' : '#000' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#5B5CE2" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Surface>
        </Grid>

        {/* Players & Tasks Column */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
            <Surface sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(91,92,226,0.1)', color: '#5B5CE2', borderRadius: '14px' }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Total Players</Typography>
                <Typography variant="h3">{data.totalUsers}</Typography>
              </Box>
            </Surface>
            <Surface sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(32,178,107,0.1)', color: '#20B26B', borderRadius: '14px' }}>
                <Language />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>Online Now</Typography>
                <Typography variant="h3">{Math.floor(data.totalUsers * 0.15) || 5}</Typography>
              </Box>
            </Surface>
            <Surface sx={{ p: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => navigate('/tasks')}
                sx={{ borderRadius: '12px', py: 1.5 }}
              >
                New Task
              </Button>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => navigate('/promos')}
                sx={{ borderRadius: '12px', py: 1.5 }}
              >
                New Promo
              </Button>
            </Surface>
          </Box>
        </Grid>

        {/* Payment Status & Action */}
        <Grid item xs={12}>
          <Surface>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h4">Attention Required</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box 
                  onClick={() => navigate('/payments')}
                  sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    p: 2, borderRadius: '16px', bgcolor: 'rgba(233, 162, 59, 0.08)', cursor: 'pointer' 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#E9A23B' }} />
                    <Typography sx={{ fontWeight: 600, color: isLight ? '#15161A' : '#F5F6F8' }}>Pending Deposits</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#E9A23B' }}>3</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box 
                  onClick={() => navigate('/payments')}
                  sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    p: 2, borderRadius: '16px', bgcolor: 'rgba(224, 82, 82, 0.08)', cursor: 'pointer' 
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#E05252' }} />
                    <Typography sx={{ fontWeight: 600, color: isLight ? '#15161A' : '#F5F6F8' }}>Pending Withdrawals</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: '#E05252' }}>5</Typography>
                </Box>
              </Grid>
            </Grid>
          </Surface>
        </Grid>

        {/* Recent Activity List */}
        <Grid item xs={12}>
          <Surface sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 1 }}>
              <Typography variant="h4">Recent Activity</Typography>
              <Button size="small" endIcon={<ChevronRight />} onClick={() => navigate('/payments')} sx={{ color: 'text.secondary' }}>
                View all
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {recentPayments.map((row, i) => (
                <React.Fragment key={i}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, gap: 2 }}>
                    {/* Left */}
                    <Avatar sx={{ 
                      width: 42, height: 42, borderRadius: '12px',
                      bgcolor: row.type === 'deposit' ? 'rgba(32,178,107,0.1)' : 'rgba(224,82,82,0.1)',
                      color: row.type === 'deposit' ? '#20B26B' : '#E05252'
                    }}>
                      {row.type === 'deposit' ? <ArrowDownward fontSize="small" /> : <ArrowUpward fontSize="small" />}
                    </Avatar>
                    
                    {/* Center */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.username || row.phone || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {row.type} • {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    {/* Right */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {row.amount} ETB
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#20B26B' }} />
                        <Typography variant="caption" sx={{ color: '#20B26B', fontWeight: 600 }}>Completed</Typography>
                      </Box>
                    </Box>
                  </Box>
                  {i < recentPayments.length - 1 && <Divider sx={{ mx: 3 }} />}
                </React.Fragment>
              ))}
              {recentPayments.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  No recent activities found.
                </Box>
              )}
            </Box>
          </Surface>
        </Grid>

      </Grid>
    </Box>
  );
}
