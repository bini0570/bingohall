import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Button, Input, cn, Skeleton } from '../components/ui';
import toast from 'react-hot-toast';
import { Search, Ban, ShieldCheck, ArrowLeft, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Players() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { data: users, error, isLoading, mutate } = useSWR(query ? /api/admin/users?search=+encodeURIComponent(query) : null, fetcher);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setQuery('');
      return;
    }
    setQuery(searchTerm);
  };

  const handleBanToggle = async (user) => {
    try {
      const action = user.is_banned ? 'unban' : 'ban';
      if (!window.confirm(Are you sure you want to +action+ +user.username+?)) return;
      
      const updatedUser = { ...user, is_banned: user.is_banned ? 0 : 1 };
      
      // Optimistic update
      if (selectedPlayer?.id === user.id) setSelectedPlayer(updatedUser);
      if (users) mutate(users.map(u => u.id === user.id ? updatedUser : u), false);

      await axios.post(/api/admin/users/+user.id+/ban);
      toast.success(User +action+
ed successfully);
      mutate();
    } catch (err) {
      toast.error('Failed to update user status');
      mutate(); // rollback
    }
  };

  if (selectedPlayer) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setSelectedPlayer(null)} className="mb-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Search
        </Button>
        
        <Card className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <UserIcon className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white">{selectedPlayer.username}</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">ID: {selectedPlayer.id} • Phone: {selectedPlayer.phone_number}</p>
            </div>
            <div>
              <span className={cn(
                "px-4 py-2 rounded-2xl text-sm font-black",
                selectedPlayer.is_banned ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
              )}>
                {selectedPlayer.is_banned ? 'BANNED' : 'ACTIVE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Main Balance</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedPlayer.balance} ETB</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Withdrawable</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedPlayer.withdrawable_balance || 0} ETB</p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Admin Actions</h3>
            <Button 
              variant={selectedPlayer.is_banned ? "secondary" : "danger"} 
              className="w-full md:w-auto"
              onClick={() => handleBanToggle(selectedPlayer)}
            >
              {selectedPlayer.is_banned ? <><ShieldCheck className="w-5 h-5 mr-2" /> Unban Player</> : <><Ban className="w-5 h-5 mr-2" /> Ban Player</>}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Player Search</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">Find players by their ID, username, or phone number to manage their accounts.</p>
      </div>

      <Card className="p-3 md:p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="flex gap-2 md:gap-3">
          <Input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Search ID, phone, or username..." 
            className="flex-1 text-base md:text-lg px-6 bg-transparent dark:bg-transparent"
          />
          <Button type="submit" size="lg" disabled={isLoading} className="px-8 rounded-xl shadow-lg">
            <Search className="w-5 h-5 mr-2" /> Search
          </Button>
        </form>
      </Card>

      {query && isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {query && !isLoading && users?.length === 0 && (
        <Card className="p-16 text-center border-dashed bg-slate-50/50 dark:bg-slate-800/30">
          <UserIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No player found</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">We couldn't find anyone matching "+query+". Try a different search term.</p>
        </Card>
      )}

      {query && !isLoading && users?.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Results ({users.length})</p>
          {users.map(user => (
            <Card 
              key={user.id} 
              className={cn("p-4 md:p-6 cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-0.5", user.is_banned && 'opacity-60')}
              onClick={() => setSelectedPlayer(user)}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                  <UserIcon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">{user.username}</h3>
                  <p className="text-sm font-medium text-slate-500 truncate">ID: {user.id} • {user.phone_number}</p>
                </div>
                <div className="text-right shrink-0 hidden md:block">
                  <p className="text-lg font-black text-slate-900 dark:text-white">{user.balance} ETB</p>
                  <p className="text-sm font-medium text-slate-500">Balance</p>
                </div>
                {user.is_banned && (
                  <div className="shrink-0 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 rounded-xl text-xs font-black">
                    BANNED
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
