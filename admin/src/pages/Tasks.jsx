import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Card, Button, Input, Select, cn, Skeleton } from '../components/ui';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

export default function Tasks() {
  const { data: tasks, error, isLoading, mutate } = useSWR('/api/admin/tasks', fetcher);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Telegram', title: '', telegram_link: '', button_name: 'Join Channel', reward: 10, target: 'All Players', required_invites: 5, required_games: 10
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tasks', formData);
      toast.success('Task created successfully');
      setCreating(false);
      mutate();
      setFormData({ type: 'Telegram', title: '', telegram_link: '', button_name: 'Join Channel', reward: 10, target: 'All Players', required_invites: 5, required_games: 10 });
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'active' ? 'disabled' : 'active';
      // optimistic update
      mutate(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t), false);
      await axios.put('/api/admin/tasks/' + task.id + '/status', { status: newStatus });
      mutate();
    } catch (err) {
      toast.error('Failed to update task');
      mutate(); // rollback
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      mutate(tasks.filter(t => t.id !== id), false);
      await axios.delete('/api/admin/tasks/' + id);
      toast.success('Task deleted');
      mutate();
    } catch (err) {
      toast.error('Failed to delete task');
      mutate();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage player reward tasks</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}><Plus className="w-5 h-5 mr-1" /> Create Task</Button>
        )}
      </div>

      {creating && (
        <Card className="p-6 md:p-8 border-t-4 border-t-indigo-500">
          <h2 className="text-xl font-black mb-6 text-slate-900 dark:text-white">Create New Task</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Task Type</label>
              <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Telegram">Telegram</option>
                <option value="Invite">Invite</option>
                <option value="Game Played">Game Played</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Task Title</label>
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Join our Telegram" />
            </div>
            {formData.type === 'Telegram' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Telegram Link</label>
                  <Input required type="url" value={formData.telegram_link} onChange={e => setFormData({...formData, telegram_link: e.target.value})} placeholder="https://t.me/..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Button Name</label>
                  <Input required value={formData.button_name} onChange={e => setFormData({...formData, button_name: e.target.value})} />
                </div>
              </>
            )}
            {formData.type === 'Invite' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Required Invites</label>
                <Input required type="number" min="1" value={formData.required_invites} onChange={e => setFormData({...formData, required_invites: e.target.value})} />
              </div>
            )}
            {formData.type === 'Game Played' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Required Games</label>
                <Input required type="number" min="1" value={formData.required_games} onChange={e => setFormData({...formData, required_games: e.target.value})} />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reward (ETB)</label>
              <Input required type="number" min="0" step="0.1" value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Audience</label>
              <Select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})}>
                <option value="All Players">All Players</option>
                <option value="New Players">New Players</option>
                <option value="Active Players">Active Players</option>
                <option value="VIP Depositors">VIP Depositors</option>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <div className="flex gap-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-12" /></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks?.map(task => (
            <Card key={task.id} className={cn("p-6 flex flex-col justify-between transition-all", task.status !== 'active' && 'opacity-60 scale-95')}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {task.type || 'Telegram'}
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white">+{task.reward} ETB</span>
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-2">{task.title}</h3>
                
                {task.type === 'Telegram' && <p className="text-sm font-medium text-slate-500 line-clamp-1">{task.telegram_link}</p>}
                {task.type === 'Invite' && <p className="text-sm font-medium text-slate-500">Requires {task.required_invites || 5} invites</p>}
                {task.type === 'Game Played' && <p className="text-sm font-medium text-slate-500">Requires {task.required_games || 10} games</p>}
                
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Target</p>
                    <p className="font-bold text-slate-900 dark:text-white">{task.target}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-medium mb-1">Claims</p>
                    <p className="font-bold text-slate-900 dark:text-white">{task.claim_count || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                <Button 
                  variant={task.status === 'active' ? "secondary" : "primary"}
                  className="flex-1"
                  onClick={() => handleToggleStatus(task)}
                >
                  {task.status === 'active' ? <><PowerOff className="w-4 h-4 mr-2"/> Disable</> : <><Power className="w-4 h-4 mr-2"/> Enable</>}
                </Button>
                <Button variant="danger" className="px-4" onClick={() => handleDelete(task.id)}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          ))}
          {tasks?.length === 0 && !creating && (
            <div className="col-span-full py-16 text-center text-slate-500 font-bold text-lg">
              No tasks created yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
