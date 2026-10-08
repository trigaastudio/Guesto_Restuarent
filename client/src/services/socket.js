import { io } from 'socket.io-client';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = RAW_URL.replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: false, withCredentials: true,
});

socket.on('connect', () => console.log('[Socket] connected, id:', socket.id, 'auth:', socket.auth));
socket.on('disconnect', (reason) => console.log('[Socket] disconnected:', reason));
socket.on('connect_error', (err) => console.log('[Socket] connect_error:', err.message));

export default socket;

