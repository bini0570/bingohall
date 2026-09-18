import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Skeleton } from '../components/ui';
import { Users, CreditCard, Activity, ArrowUpRight } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data, error, isLoading } = useSWR('/api/admin/stats', fetcher);

  const stats = [
    { label: 'Total Players', value: data?.totalPlayers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Deposits', value: data?.totalDeposits ? data.totalDeposits + ' ETB' : null, icon: CreditCard, color: 'text-indigo-500' },
    { label: 'Total Withdrawals', value: data?.totalWithdrawals ? data.totalWithdrawals + ' ETB' : null, icon: Activity, color: 'text-violet-500' },
    { label: 'Active Rounds', value: data?.activeRounds, icon: ArrowUpRight, color: 'text-fuchsia-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Platform statistics and live metrics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-5 md:p-6 flex flex-col justify-between aspect-square md:aspect-auto">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 ${stat.color}`}>
                <stat.icon className="w-6 h-6 md:w-8 md:h-8" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 md:h-10 md:w-32 mt-1" />
              ) : (
                <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white truncate">
                  {stat.value || '0'}
                </h3>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
