let _socketLib = null;
let _socket = null;

// Tự động xác định URL backend
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export async function loadSocketIO() {
  if (_socketLib) return _socketLib;
  return new Promise((resolve, reject) => {
    if (window.io) {
      _socketLib = window.io;
      resolve(_socketLib);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    s.onload = () => {
      _socketLib = window.io;
      resolve(_socketLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function getSocket() {
  if (_socket?.connected) return _socket;

  const io = await loadSocketIO();

  // ✅ Không gửi token qua auth nữa, thay vào đó dùng cookie (withCredentials)
  _socket = io(SOCKET_URL, {
    withCredentials: true, // gửi cookie kèm theo handshake
    autoConnect: true,
    transports: ["websocket", "polling"],
  });

  return _socket;
}

export function disconnectSocket() {
  _socket?.disconnect();
  _socket = null;
}
