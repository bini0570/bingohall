import React, { useState } from 'react';
import axios from 'axios';
import { Card, Button, Input, cn } from '../components/ui';
import toast from 'react-hot-toast';
import { Search, Ban, ShieldCheck, ArrowLeft, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function Players() {
  const [users, setUsers] = useState(null); // null means not searched yet
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setUsers(null);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users?search=' + encodeURIComponent(searchTerm));
      setUsers(data);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (user) => {
    try {
      const action = user.is_banned ? 'unban' : 'ban';
      if (!window.confirm('Are you sure you want to ' + action + ' ' + user.username + '?')) return;
      
      await axios.post('/api/admin/users/' + user.id + '/ban');
      toast.success('User ' + action + 'ned successfully');
      
      const updatedUser = { ...user, is_banned: user.is_banned ? 0 : 1 };
      if (selectedPlayer?.id === user.id) setSelectedPlayer(updatedUser);
      if (users) setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  if (selectedPlayer) {
    const u = selectedPlayer;
    return (
      <div className="space-y-6 animate-in fade-in">
        <button 
          onClick={() => setSelectedPlayer(null)} 
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Search
        </button>

        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 flex items-center gap-4 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {u.username}
                {u.is_admin === 1 && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>}
              </h2>
              <p className="text-blue-100 mt-1">{u.phone || 'No phone number'}</p>
            </div>
          </div>
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Account Details</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Player ID</span>
                    <span className="font-mono font-medium text-gray-900">#{u.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Joined Date</span>
                    <span className="font-medium text-gray-900">{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Status</span>
                    {u.is_banned ? (
                      <span className="text-red-600 font-bold">Banned</span>
                    ) : (
                      <span className="text-green-600 font-bold">Active</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Wallet</h3>
                <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="text-xl font-black text-gray-900">{parseFloat(u.balance || 0).toFixed(2)} ETB</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Admin Actions</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  {!u.is_admin ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        {u.is_banned 
                          ? "This user is currently banned and cannot access the platform." 
                          : "Ban this user to immediately revoke their access to the platform."}
                      </p>
                      <Button 
                        className="w-full justify-center"
                        variant={u.is_banned ? "primary" : "danger"} 
                        onClick={() => handleBanToggle(u)}
                      >
                        {u.is_banned ? <ShieldCheck className="w-4 h-4 mr-2"/> : <Ban className="w-4 h-4 mr-2"/>}
                        {u.is_banned ? 'Unban Player' : 'Ban Player'}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Admin accounts are protected from moderation actions.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Players</h1>
        <p className="text-gray-500">Search and manage player accounts</p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              className="pl-10 w-full" 
              placeholder="Search by ID, username, or phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto justify-center">
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </Card>

      {users === null && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Enter a search term to find players</p>
        </div>
      )}

      {users !== null && users.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <p>No player found.</p>
        </div>
      )}

      {users !== null && users.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Player Info</th>
                  <th className="px-6 py-3">Balance</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(u => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedPlayer(u)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{u.username} {u.is_admin === 1 && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>}</div>
                      <div className="text-sm text-gray-500">{u.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{parseFloat(u.balance || 0).toFixed(2)} ETB</td>
                    <td className="px-6 py-4">
                      {u.is_banned ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Banned</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-200">
            {users.map(u => (
              <div 
                key={u.id} 
                className="p-4 space-y-3 active:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setSelectedPlayer(u)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {u.username}
                      {u.is_admin === 1 && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{u.phone || 'No phone'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{parseFloat(u.balance || 0).toFixed(2)} ETB</div>
                    <div className="text-xs text-gray-500 mt-0.5">#{u.id}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {u.is_banned ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Banned</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-blue-600">View Profile &rarr;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
