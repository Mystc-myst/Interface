import io from 'socket.io-client';

const socket = io('http://localhost:5001', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'], // Explicitly define transports
});

export default socket;
