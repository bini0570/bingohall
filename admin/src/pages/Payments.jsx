import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, cn } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

export default function Payments() {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('deposits');

  const fetchData = async () => {
    try {
      const [depRes, witRes] = await Promise.all([
        axios.get('/api/admin/deposits'),
        axios.get('/api/admin/withdrawals')
      ]);
      setDeposits(depRes.data);
      setWithdrawals(witRes.data);
    } catch (err) {
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (type, id, action) => {
    try {
      await axios.post(`/api/admin/${type}/${id}/${action}`);
      toast.success(`${action} successful`);
      fetchData();
    } catch (err) {
      toast.error(`Failed to ${action}`);
    }
  };

  if (loading) return <div className="text-gray-500">Loading payments...</div>;

  const StatusBadge = ({ status }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={cn("px-2 py-1 text-xs font-medium rounded-full uppercase tracking-wider", colors[status])}>
        {status}
      </span>
    );
  };

  const TableHeader = ({ headers }) => (
    <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <tr>
        {headers.map(h => <th key={h} className="px-6 py-3">{h}</th>)}
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">Process deposits and withdrawals</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTab('deposits')}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", tab === 'deposits' ? 'bg-white shadow text-gray-900' : 'text-gray-500')}
          >
            Deposits
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", tab === 'withdrawals' ? 'bg-white shadow text-gray-900' : 'text-gray-500')}
          >
            Withdrawals
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            {tab === 'deposits' ? (
              <>
                <TableHeader headers={['Date', 'User', 'Method', 'Amount', 'Ref / SMS', 'Status', 'Actions']} />
                <tbody className="divide-y divide-gray-200">
                  {deposits.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(d.created_at), 'MMM d, HH:mm')}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{d.username}</div>
                        <div className="text-sm text-gray-500">{d.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{d.method}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{d.amount} ETB</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{d.receipt_sms || '-'}</td>
                      <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                      <td className="px-6 py-4">
                        {d.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleAction('deposits', d.id, 'approve')}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleAction('deposits', d.id, 'reject')}><X className="w-4 h-4 mr-1"/> Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No deposits found.</td></tr>
                  )}
                </tbody>
              </>
            ) : (
              <>
                <TableHeader headers={['Date', 'User', 'Method', 'Account Details', 'Amount', 'Status', 'Actions']} />
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(w.created_at), 'MMM d, HH:mm')}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{w.username}</div>
                        <div className="text-sm text-gray-500">{w.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{w.method}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{w.account_name || '-'}</div>
                        <div className="text-sm text-gray-500 font-mono">{w.account_number}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{w.amount} ETB</td>
                      <td className="px-6 py-4"><StatusBadge status={w.status} /></td>
                      <td className="px-6 py-4">
                        {w.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" onClick={() => handleAction('withdrawals', w.id, 'approve')}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => handleAction('withdrawals', w.id, 'reject')}><X className="w-4 h-4 mr-1"/> Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">No withdrawals found.</td></tr>
                  )}
                </tbody>
              </>
            )}
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {tab === 'deposits' ? (
            deposits.map(d => (
              <div key={d.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{d.username}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{d.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{d.amount} ETB</div>
                    <div className="text-xs text-gray-500 mt-0.5">{format(new Date(d.created_at), 'MMM d, HH:mm')}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-2.5 rounded-lg text-sm grid grid-cols-2 gap-2 border border-gray-100">
                  <div>
                    <span className="text-gray-500 text-xs block mb-0.5">Method</span>
                    <span className="font-medium text-gray-900">{d.method}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block mb-0.5">Ref / SMS</span>
                    <span className="font-mono text-gray-900 truncate">{d.receipt_sms || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={d.status} />
                  {d.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" className="px-3" onClick={() => handleAction('deposits', d.id, 'approve')}><Check className="w-4 h-4"/></Button>
                      <Button size="sm" variant="danger" className="px-3" onClick={() => handleAction('deposits', d.id, 'reject')}><X className="w-4 h-4"/></Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            withdrawals.map(w => (
              <div key={w.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{w.username}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{w.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{w.amount} ETB</div>
                    <div className="text-xs text-gray-500 mt-0.5">{format(new Date(w.created_at), 'MMM d, HH:mm')}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-2.5 rounded-lg text-sm border border-gray-100">
                  <div className="text-gray-500 text-xs mb-1">Account Details ({w.method})</div>
                  <div className="font-medium text-gray-900">{w.account_name || '-'}</div>
                  <div className="font-mono text-gray-600 mt-0.5">{w.account_number}</div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <StatusBadge status={w.status} />
                  {w.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" className="px-3" onClick={() => handleAction('withdrawals', w.id, 'approve')}><Check className="w-4 h-4"/></Button>
                      <Button size="sm" variant="danger" className="px-3" onClick={() => handleAction('withdrawals', w.id, 'reject')}><X className="w-4 h-4"/></Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {tab === 'deposits' && deposits.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No deposits found.</div>
          )}
          {tab === 'withdrawals' && withdrawals.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No withdrawals found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
