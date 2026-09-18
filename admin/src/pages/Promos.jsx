import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input, cn } from '../components/ui';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, PowerOff, Gift } from 'lucide-react';

export default function Promos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    reward: 10,
    usage_limit: 100
  });

  const fetchPromos = async () => {
    try {
      const { data } = await axios.get('/api/admin/promos');
      setPromos(data);
    } catch (err) {
      toast.error('Failed to load promos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/promos', formData);
      toast.success('Promo created successfully');
      setCreating(false);
      fetchPromos();
      setFormData({ code: '', reward: 10, usage_limit: 100 });
    } catch (err) {
      toast.error('Failed to create promo');
    }
  };

  const handleToggleStatus = async (promo) => {
    try {
      const newStatus = promo.status === 'active' ? 'disabled' : 'active';
      await axios.put(`/api/admin/promos/${promo.id}/status`, { status: newStatus });
      fetchPromos();
    } catch (err) {
      toast.error('Failed to update promo');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await axios.delete(`/api/admin/promos/${id}`);
      toast.success('Promo deleted');
      fetchPromos();
    } catch (err) {
      toast.error('Failed to delete promo');
    }
  };

  if (loading) return <div className="text-gray-500">Loading promos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-500">Manage promo codes and rewards</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}><Plus className="w-5 h-5 mr-1" /> Create Promo</Button>
        )}
      </div>

      {creating && (
        <Card className="p-6 border-t-4 border-t-indigo-600">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Create Promo Code</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
              <Input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. VIP2024" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward (ETB)</label>
              <Input required type="number" min="0" step="0.1" value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (-1 for unlimited)</label>
              <Input required type="number" min="-1" value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: e.target.value})} />
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Create Promo</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map(promo => (
          <Card key={promo.id} className={cn("p-5 flex flex-col justify-between transition-opacity", promo.status !== 'active' && 'opacity-60')}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-gray-900">+{promo.reward} ETB</span>
              </div>
              <h3 className="font-mono font-bold text-gray-900 text-2xl tracking-wider mb-2">{promo.code}</h3>
              
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Used</p>
                  <p className="font-medium text-gray-900">{promo.used_count || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Limit</p>
                  <p className="font-medium text-gray-900">{promo.usage_limit === -1 ? 'Unlimited' : promo.usage_limit}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-5 flex gap-2">
              <Button 
                variant={promo.status === 'active' ? "secondary" : "primary"}
                size="sm"
                className="flex-1"
                onClick={() => handleToggleStatus(promo)}
              >
                {promo.status === 'active' ? <><PowerOff className="w-4 h-4 mr-1"/> Disable</> : <><Power className="w-4 h-4 mr-1"/> Enable</>}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(promo.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {promos.length === 0 && !creating && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No promo codes created yet.
          </div>
        )}
      </div>
    </div>
  );
}
