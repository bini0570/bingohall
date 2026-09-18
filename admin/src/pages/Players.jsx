import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Card, Button, Input } from '../components/ui';
import toast from 'react-hot-toast';
import { Search, Ban, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function Players() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/admin/users');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanToggle = async (user) => {
    try {
      const action = user.is_banned ? 'unban' : 'ban';
      if (!window.confirm(`Are you sure you want to ${action} ${user.username}?`)) return;
      
      await axios.post(`/api/admin/users/${user.id}/ban`);
      toast.success(`User ${action}ned successfully`);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return users.filter(u => 
      String(u.id).includes(s) || 
      (u.username || '').toLowerCase().includes(s) || 
      (u.phone || '').includes(s)
    );
  }, [users, searchTerm]);

  if (loading) return <div className="text-gray-500">Loading players...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Players</h1>
        <p className="text-gray-500">View player accounts and moderate access</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by ID, username, or phone..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Player Info</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{u.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{u.username} {u.is_admin === 1 && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>}</div>
                  <div className="text-sm text-gray-500">{u.phone || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{parseFloat(u.balance || 0).toFixed(2)} ETB</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '-'}</td>
                <td className="px-6 py-4">
                  {u.is_banned ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Banned</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {!u.is_admin ? (
                    <Button 
                      size="sm" 
                      variant={u.is_banned ? "primary" : "danger"} 
                      onClick={() => handleBanToggle(u)}
                    >
                      {u.is_banned ? <ShieldCheck className="w-4 h-4 mr-1"/> : <Ban className="w-4 h-4 mr-1"/>}
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </Button>
                  ) : <span className="text-xs text-gray-400">Protected</span>}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No players found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
