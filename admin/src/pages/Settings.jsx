import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input } from '../components/ui';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    ticket_price: '10',
    countdown_sec: '40',
    commission_pct: '20',
    referral_reward_etb: '10',
    auto_start: 'true'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/public/settings');
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/admin/settings', settings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500">Configure core game and operational parameters</p>
      </div>

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Game Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (ETB)</label>
                  <Input 
                    type="number" min="1" 
                    value={settings.ticket_price} 
                    onChange={e => setSettings({...settings, ticket_price: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Countdown Duration (sec)</label>
                  <Input 
                    type="number" min="10" 
                    value={settings.countdown_sec} 
                    onChange={e => setSettings({...settings, countdown_sec: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Commission (%)</label>
                  <Input 
                    type="number" min="0" max="100" 
                    value={settings.commission_pct} 
                    onChange={e => setSettings({...settings, commission_pct: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto Start Next Round</label>
                  <select 
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={settings.auto_start}
                    onChange={e => setSettings({...settings, auto_start: e.target.value})}
                  >
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Rewards</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referral Reward (ETB)</label>
                  <Input 
                    type="number" min="0" 
                    value={settings.referral_reward_etb} 
                    onChange={e => setSettings({...settings, referral_reward_etb: e.target.value})} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Given to referrer when invited user deposits</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saving} className="px-6">
                {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
