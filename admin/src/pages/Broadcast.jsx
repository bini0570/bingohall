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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
        <p className="text-gray-500">Send system-wide announcements to all players</p>
      </div>

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                placeholder="Write your announcement here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be sent to all users via their connected Telegram bot if available.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1.5" />
                Target: All System Users
              </div>
              <Button type="submit" disabled={loading || !message.trim()} className="px-6">
                {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Broadcast</>}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
