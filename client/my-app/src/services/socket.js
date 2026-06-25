let _socketLib = null;
let _socket = null;

// Tự động xác định URL backend:
// - Trong dev (Vite proxy): dùng window.location.origin (proxy /socket.io → localhost:5000)
// - Trong prod: đặt VITE_SOCKET_URL trong .env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export async function loadSocketIO() {
  if (_socketLib) return _socketLib;
  return new Promise((resolve, reject) => {
    if (window.io) {
      _socketLib = window.io;
      resolve(_socketLib);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    s.onload = () => {
      _socketLib = window.io;
      resolve(_socketLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function getSocket(token) {
  if (_socket?.connected) return _socket;
  const io = await loadSocketIO();
  _socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}
