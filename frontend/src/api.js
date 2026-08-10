// Central API configuration
// Dev:  empty string → Vite proxy forwards /api → localhost:4000
// Prod: VITE_API_URL = https://localhost:4000

export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Drop-in fetch() wrapper that prepends the Railway URL in production.
 * Usage: apiFetch('/api/game/buy-ticket', { method: 'POST', headers, body })
 */
export async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

/**
 * Socket.io server URL.
 * Dev:  '' (Vite proxy handles /socket.io → localhost:4000)
 * Prod: full Railway URL
 */
export const SOCKET_URL = import.meta.env.VITE_API_URL || '';
