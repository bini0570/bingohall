import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Button, Input, Select, cn } from '../components/ui';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Telegram',
    title: '',
    telegram_link: '',
    button_name: 'Join Channel',
    reward: 10,
    target: 'All Players',
    required_invites: 5,
    required_games: 10
  });

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get('/api/admin/tasks');
      setTasks(data);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/tasks', formData);
      toast.success('Task created successfully');
      setCreating(false);
      fetchTasks();
      setFormData({ 
        type: 'Telegram', 
        title: '', 
        telegram_link: '', 
        button_name: 'Join Channel', 
        reward: 10, 
        target: 'All Players',
        required_invites: 5,
        required_games: 10
      });
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === 'active' ? 'disabled' : 'active';
      await axios.put(`/api/admin/tasks/${task.id}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await axios.delete(`/api/admin/tasks/${id}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  if (loading) return <div className="text-gray-500">Loading tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Manage player reward tasks</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}><Plus className="w-5 h-5 mr-1" /> Create Task</Button>
        )}
      </div>

      {creating && (
        <Card className="p-6 border-t-4 border-t-blue-600">
          <h2 className="text-lg font-bold mb-4 text-gray-900">Create New Task</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <Select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="Telegram">Telegram</option>
                <option value="Invite">Invite</option>
                <option value="Game Played">Game Played</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Join our Telegram" />
            </div>

            {formData.type === 'Telegram' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Link</label>
                  <Input required type="url" value={formData.telegram_link} onChange={e => setFormData({...formData, telegram_link: e.target.value})} placeholder="https://t.me/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Name</label>
                  <Input required value={formData.button_name} onChange={e => setFormData({...formData, button_name: e.target.value})} />
                </div>
              </>
            )}

            {formData.type === 'Invite' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Invites</label>
                <Input required type="number" min="1" value={formData.required_invites} onChange={e => setFormData({...formData, required_invites: e.target.value})} />
              </div>
            )}

            {formData.type === 'Game Played' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Games</label>
                <Input required type="number" min="1" value={formData.required_games} onChange={e => setFormData({...formData, required_games: e.target.value})} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward (ETB)</label>
              <Input required type="number" min="0" step="0.1" value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <Card key={task.id} className={cn("p-5 flex flex-col justify-between transition-opacity", task.status !== 'active' && 'opacity-60')}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {task.type || 'Telegram'}
                </span>
                <span className="text-lg font-bold text-gray-900">+{task.reward} ETB</span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{task.title}</h3>
              
              {task.type === 'Telegram' && <p className="text-sm text-gray-500 line-clamp-1">{task.telegram_link}</p>}
              {task.type === 'Invite' && <p className="text-sm text-gray-500">Requires {task.required_invites || 5} invites</p>}
              {task.type === 'Game Played' && <p className="text-sm text-gray-500">Requires {task.required_games || 10} games</p>}
              
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Target</p>
                  <p className="font-medium text-gray-900">{task.target}</p>
                </div>
                <div>
                  <p className="text-gray-500">Claims</p>
                  <p className="font-medium text-gray-900">{task.claim_count || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-5 flex gap-2">
              <Button 
                variant={task.status === 'active' ? "secondary" : "primary"}
                size="sm"
                className="flex-1"
                onClick={() => handleToggleStatus(task)}
              >
                {task.status === 'active' ? <><PowerOff className="w-4 h-4 mr-1"/> Disable</> : <><Power className="w-4 h-4 mr-1"/> Enable</>}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(task.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && !creating && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No tasks created yet.
          </div>
        )}
      </div>
    </div>
  );
}
