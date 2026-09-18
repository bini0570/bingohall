import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Button, cn, Skeleton } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Check, X } from 'lucide-react';

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
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
    };
    return (
      <span className={cn("px-3 py-1 text-xs font-bold rounded-xl uppercase tracking-wider", colors[status])}>
        {status}
      </span>
    );
  };

  const TableHeader = ({ headers }) => (
    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
      <tr>
        {headers.map(h => <th key={h} className="px-6 py-4">{h}</th>)}
      </tr>
    </thead>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Process deposits and withdrawals</p>
        </div>
        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setTab('deposits')}
            className={cn("px-6 py-2 text-sm font-bold rounded-xl transition-all", tab === 'deposits' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')}
          >
            Deposits
          </button>
          <button
            onClick={() => setTab('withdrawals')}
            className={cn("px-6 py-2 text-sm font-bold rounded-xl transition-all", tab === 'withdrawals' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white')}
          >
            Withdrawals
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                {tab === 'deposits' ? (
                  <>
                    <TableHeader headers={['Date', 'User', 'Method', 'Amount', 'Ref / SMS', 'Status', 'Actions']} />
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {deposits?.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(d.created_at), 'MMM d, HH:mm')}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{d.username}</div>
                            <div className="text-sm font-medium text-slate-500">{d.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-300">{d.method}</td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{d.amount} ETB</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 rounded-lg">{d.receipt_sms || '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                          <td className="px-6 py-4">
                            {d.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAction('deposits', d.id, 'approve')}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => handleAction('deposits', d.id, 'reject')}><X className="w-4 h-4 mr-1"/> Reject</Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {deposits?.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-bold">No deposits found.</td></tr>}
                    </tbody>
                  </>
                ) : (
                  <>
                    <TableHeader headers={['Date', 'User', 'Method', 'Account Details', 'Amount', 'Status', 'Actions']} />
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {withdrawals?.map(w => (
                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(w.created_at), 'MMM d, HH:mm')}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">{w.username}</div>
                            <div className="text-sm font-medium text-slate-500">{w.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-300">{w.method}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{w.account_name || '-'}</div>
                            <div className="text-sm text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 inline-block px-2 py-0.5 rounded-lg mt-1">{w.account_number}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900 dark:text-white">{w.amount} ETB</td>
                          <td className="px-6 py-4"><StatusBadge status={w.status} /></td>
                          <td className="px-6 py-4">
                            {w.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAction('withdrawals', w.id, 'approve')}><Check className="w-4 h-4 mr-1"/> Approve</Button>
                                <Button size="sm" variant="danger" onClick={() => handleAction('withdrawals', w.id, 'reject')}><X className="w-4 h-4 mr-1"/> Reject</Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {withdrawals?.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500 font-bold">No withdrawals found.</td></tr>}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {currentData?.map(item => (
                <div key={item.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white text-lg">{item.username}</div>
                      <div className="text-sm font-medium text-slate-500 mt-0.5">{item.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{item.amount} ETB</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">{format(new Date(item.created_at), 'MMM d, HH:mm')}</div>
                    </div>
                  </div>
                  
                  {tab === 'deposits' ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-sm grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 font-medium text-xs block mb-1">Method</span>
                        <span className="font-bold text-slate-900 dark:text-white">{item.method}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium text-xs block mb-1">Ref / SMS</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 block truncate">{item.receipt_sms || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-sm">
                      <div className="text-slate-400 font-medium text-xs mb-1.5">Account Details ({item.method})</div>
                      <div className="font-bold text-slate-900 dark:text-white mb-1">{item.account_name || '-'}</div>
                      <div className="font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 inline-block px-2 py-1 rounded-lg">{item.account_number}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <StatusBadge status={item.status} />
                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="px-4 py-2" onClick={() => handleAction(tab, item.id, 'approve')}><Check className="w-5 h-5"/></Button>
                        <Button size="sm" variant="danger" className="px-4 py-2" onClick={() => handleAction(tab, item.id, 'reject')}><X className="w-5 h-5"/></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {currentData?.length === 0 && (
                <div className="p-12 text-center text-slate-500 font-bold">No {tab} found.</div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
