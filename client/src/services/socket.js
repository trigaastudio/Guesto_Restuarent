import { io } from 'socket.io-client';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = RAW_URL.replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: false, withCredentials: true,
});

export default socket;

