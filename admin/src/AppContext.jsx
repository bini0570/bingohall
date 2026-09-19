import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { mutate } from 'swr';

const seen = new Set();
export function useReady(key) {
  const [ready, setReady] = useState(() => seen.has(key));
  useEffect(() => {
    if (ready) return undefined;
    const t = setTimeout(() => { seen.add(key); setReady(true); }, 380);
    return () => clearTimeout(t);
  }, []);
  return ready;
}

export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const fetcher = url => axios.get(url).then(res => res.data);

export function setupAxios(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function revalidateAll() {
  mutate('/api/admin/metrics');
  mutate('/api/admin/deposits');
  mutate('/api/admin/withdrawals');
  mutate('/api/admin/tasks');
  mutate('/api/admin/promos');
}
