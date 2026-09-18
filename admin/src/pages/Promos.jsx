import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Button, Input, cn, Skeleton } from '../components/ui';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, PowerOff, Gift } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Promos() {
  const { data: promos, error, isLoading, mutate } = useSWR('/api/admin/promos', fetcher);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ code: '', reward: 10, usage_limit: 100 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/promos', formData);
      toast.success('Promo created successfully');
      setCreating(false);
      mutate();
      setFormData({ code: '', reward: 10, usage_limit: 100 });
    } catch (err) {
      toast.error('Failed to create promo');
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === 'active' ? 'disabled' : 'active';
      mutate(promos.map(p => p.id === promo.id ? { ...p, status: newStatus } : p), false);
      await axios.put(/api/admin/promos/${promo.id}/status, { status: newStatus });
      mutate();
    } catch (err) {
      toast.error('Failed to update promo');
      mutate();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      mutate(promos.filter(p => p.id !== id), false);
      await axios.delete(/api/admin/promos/${id}`);
      toast.success('Promo deleted');
      mutate();
    } catch (err) {
      toast.error('Failed to delete promo');
      mutate();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Promotions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage promo codes and rewards</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}><Plus className="w-5 h-5 mr-1" /> Create Promo</Button>
        )}
      </div>

      {creating && (
        <Card className="p-6 md:p-8 border-t-4 border-t-violet-500">
          <h2 className="text-xl font-black mb-6 text-slate-900 dark:text-white">Create Promo Code</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Promo Code</label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. VIP2024" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reward (ETB)</label>
              <Input required type="number" min="0" step="0.1" value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Usage Limit (-1 for unlimited)</label>
              <Input required type="number" min="-1" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit">Create Promo</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="w-12 h-12 rounded-2xl mb-4" />
              <Skeleton className="h-8 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-6" />
              <div className="flex gap-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-12" /></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos?.map(promo => (
            <Card key={promo.id} className={cn("p-6 flex flex-col justify-between transition-all", promo.status !== 'active' && 'opacity-60 scale-95')}>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-600 shadow-lg shadow-fuchsia-500/30 text-white flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">+{promo.reward} ETB</span>
                </div>
                <h3 className="font-mono font-black text-slate-900 dark:text-white text-3xl tracking-widest mb-2 truncate">{promo.code}</h3>
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Used</p>
                    <p className="font-bold text-slate-900 dark:text-white">{promo.used_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Limit</p>
                    <p className="font-bold text-slate-900 dark:text-white">{promo.usage_limit === -1 ? 'Unlimited' : promo.usage_limit}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button 
                  variant={promo.status === 'active' ? "secondary" : "primary"}
                  className="flex-1"
                  onClick={() => handleToggleStatus(promo)}
                >
                  {promo.status === 'active' ? <><PowerOff className="w-4 h-4 mr-2"/> Disable</> : <><Power className="w-4 h-4 mr-2"/> Enable</>}
                </Button>
                <Button variant="danger" className="px-4" onClick={() => handleDelete(promo.id)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
          {promos?.length === 0 && !creating && (
            <div className="col-span-full py-16 text-center text-slate-500 font-bold text-lg">
              No promo codes created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
