import { io } from 'socket.io-client';

// In development: connect to same origin (proxied by Vite to :4000)
// In production: VITE_API_URL = https://localhost:4000
const BACKEND_URL = import.meta.env.VITE_API_URL || '';

export const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

export default socket;
