import React, { createContext, useContext, useState, useEffect } from 'react';

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
