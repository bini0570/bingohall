import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, CreditCard, ArrowDownCircle, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../components/ui';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const { data } = await axios.get('/api/admin/metrics');
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!metrics) return null;

  const stats = [
    { label: 'Total Players', value: metrics.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Today\'s Users', value: metrics.todayUsers || 0, icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Online Users', value: metrics.onlineUsers, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Deposits', value: `${(metrics.totalDeposits || 0).toLocaleString()} ETB`, icon: ArrowDownCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Total Withdrawals', value: `${(metrics.totalWithdrawals || 0).toLocaleString()} ETB`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'System Profit', value: `${(metrics.revenue || 0).toLocaleString()} ETB`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">System overview and key metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="mt-1">
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 truncate">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Requests</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-orange-800">Pending Deposits</p>
                <p className="text-2xl font-bold text-orange-900">{metrics.pendingDeposits || 0}</p>
              </div>
              <a href="/payments" className="text-sm font-medium text-orange-600 hover:text-orange-700">Review &rarr;</a>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.pendingWithdrawals || 0}</p>
              </div>
              <a href="/payments" className="text-sm font-medium text-blue-600 hover:text-blue-700">Review &rarr;</a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
