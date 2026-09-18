import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/ui';
import { Moon, Sun, Lock, LogOut } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';

export default function Settings() {
  const { logout } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Password state
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    setPassLoading(true);
    try {
      await axios.post('/api/admin/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      toast.success('Password changed successfully');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your admin preferences and account</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <Input 
              type="password" 
              required 
              value={passData.currentPassword}
              onChange={e => setPassData({...passData, currentPassword: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <Input 
              type="password" 
              required 
              value={passData.newPassword}
              onChange={e => setPassData({...passData, newPassword: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <Input 
              type="password" 
              required 
              value={passData.confirmPassword}
              onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={passLoading}>
              {passLoading ? 'Saving...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Theme Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-colors }
          >
            <Sun className="w-6 h-6" />
            <span className="font-medium">Light Mode</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-colors }
          >
            <Moon className="w-6 h-6" />
            <span className="font-medium">Dark Mode</span>
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Logout</h2>
        <p className="text-sm text-gray-500 mb-4">Securely end your session and log out of the admin panel.</p>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </Card>
    </div>
  );
}
