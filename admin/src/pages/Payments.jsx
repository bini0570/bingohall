import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack } from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import AnimatedPage from '../components/AnimatedPage';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Payments() {
  const [tab, setTab] = useState('deposits');
  
  const { data: deposits, error: depErr, isLoading: depLoad, mutate: mutateDep } = useSWR('/api/admin/deposits', fetcher);
  const { data: withdrawals, error: witErr, isLoading: witLoad, mutate: mutateWit } = useSWR('/api/admin/withdrawals', fetcher);

  const handleAction = async (type, id, action) => {
    try {
      await axios.post('/api/admin/' + type + '/' + id + '/' + action);
      toast.success(action + ' successful');
      if (type === 'deposits') mutateDep();
      if (type === 'withdrawals') mutateWit();
    } catch (err) {
      toast.error('Failed to ' + action);
    }
  };

  const isLoading = tab === 'deposits' ? depLoad : witLoad;
  const currentData = tab === 'deposits' ? deposits : withdrawals;

  const StatusBadge = ({ status }) => {
    const colors = {
      pending: { bg: '#fef3c7', text: '#d97706' },
      approved: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' }
    };
    const color = colors[status] || colors.pending;
    return (
      <Chip 
        label={status.toUpperCase()} 
        size="small" 
        sx={{ bgcolor: color.bg, color: color.text, fontWeight: 900, borderRadius: '8px', letterSpacing: '0.05em' }} 
      />
    );
  };

  return (
    <AnimatedPage>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h3">Payments</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>Process deposits and withdrawals</Typography>
        </Box>
        <Box sx={{ display: 'flex', bgcolor: 'rgba(15, 23, 42, 0.04)', p: 0.5, borderRadius: '16px' }}>
          <Button 
            disableElevation
            variant={tab === 'deposits' ? 'contained' : 'text'}
            onClick={() => setTab('deposits')}
            sx={{ borderRadius: '12px', color: tab === 'deposits' ? 'white' : 'text.secondary', fontWeight: 800 }}
          >
            Deposits
          </Button>
          <Button 
            disableElevation
            variant={tab === 'withdrawals' ? 'contained' : 'text'}
            onClick={() => setTab('withdrawals')}
            sx={{ borderRadius: '12px', color: tab === 'withdrawals' ? 'white' : 'text.secondary', fontWeight: 800 }}
          >
            Withdrawals
          </Button>
        </Box>
      </Box>

      <Card sx={{ overflow: 'hidden', p: 0 }}>
        {/* Desktop Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>DATE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>USER</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>METHOD</TableCell>
                  {tab === 'withdrawals' && <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ACCOUNT</TableCell>}
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>AMOUNT</TableCell>
                  {tab === 'deposits' && <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>REF / SMS</TableCell>}
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!isLoading && currentData?.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{format(new Date(row.created_at), 'MMM d, HH:mm')}</TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{row.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.phone}</Typography>
                    </TableCell>
                    <TableCell>{row.method}</TableCell>
                    {tab === 'withdrawals' && (
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{row.account_name || '-'}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(15, 23, 42, 0.04)', px: 1, borderRadius: 1 }}>
                          {row.account_number}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 900 }}>{row.amount} ETB</Typography></TableCell>
                    {tab === 'deposits' && (
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(15, 23, 42, 0.04)', px: 1, borderRadius: 1 }}>
                          {row.receipt_sms || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>
                      {row.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained" color="success" onClick={() => handleAction(tab, row.id, 'approve')} sx={{ minWidth: 40, px: 1 }}><Check /></Button>
                          <Button size="small" variant="contained" color="error" onClick={() => handleAction(tab, row.id, 'reject')} sx={{ minWidth: 40, px: 1 }}><Close /></Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {currentData?.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary', fontWeight: 800 }}>No {tab} found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Mobile View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {currentData?.map((item) => (
            <Box key={item.id} sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>{item.username}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.phone}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>{item.amount} ETB</Typography>
                  <Typography variant="caption" color="text.secondary">{format(new Date(item.created_at), 'MMM d, HH:mm')}</Typography>
                </Box>
              </Box>

              <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)', p: 2, borderRadius: '16px', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  {tab === 'deposits' ? 'Method & Ref' : 'Account Details'}
                </Typography>
                {tab === 'deposits' ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.method}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{item.receipt_sms || '-'}</Typography>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{item.account_name || '-'}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{item.account_number}</Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusBadge status={item.status} />
                {item.status === 'pending' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => handleAction(tab, item.id, 'approve')} sx={{ minWidth: 44, height: 44, px: 0, borderRadius: '12px' }}><Check /></Button>
                    <Button size="small" variant="contained" color="error" onClick={() => handleAction(tab, item.id, 'reject')} sx={{ minWidth: 44, height: 44, px: 0, borderRadius: '12px' }}><Close /></Button>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
          {currentData?.length === 0 && (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', fontWeight: 800 }}>No {tab} found.</Box>
          )}
        </Box>
      </Card>
    </AnimatedPage>
  );
}
