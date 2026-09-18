import React, { useState } from 'react';
import axios from 'axios';
import { Card, Button } from '../components/ui';
import toast from 'react-hot-toast';
import { Send, Users } from 'lucide-react';

export default function Broadcast() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!window.confirm('Send this broadcast to all system users?')) return;

    setLoading(true);
    try {
      await axios.post('/api/admin/broadcast', { message });
      toast.success('Broadcast sent successfully!');
      setMessage('');
    } catch (err) {
      toast.error('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Broadcast</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Send system-wide announcements to all players</p>
      </div>

      <div className="max-w-3xl">
        <Card className="p-6 md:p-8">
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Message Content</label>
              <textarea
                className="w-full rounded-2xl border-none bg-slate-100 dark:bg-slate-800/50 px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow min-h-[160px] resize-y"
                placeholder="Write your announcement here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3">
                This message will be broadcasted to all users via their connected Telegram bot.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Target: All System Users
              </div>
              <Button type="submit" disabled={loading || !message.trim()} className="w-full sm:w-auto px-8 py-3">
                {loading ? 'Sending...' : <><Send className="w-5 h-5 mr-2" /> Send Broadcast</>}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
