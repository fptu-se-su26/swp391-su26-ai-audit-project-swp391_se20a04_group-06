/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { useAuth } from "./AuthContext";
import { addNotification } from "../store/slices/notificationSlice";

const SocketContext = createContext(null);
const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user || !socketUrl) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      return undefined;
    }

    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);

    if (socketInstance.connected) {
      setIsConnected(true);
    }

    socketInstance.on("notification", (notification) => {
      dispatch(addNotification(notification));
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.disconnect();
      if (socketRef.current === socketInstance) socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, dispatch]);

  const joinConversation = useCallback((productId, buyerId) => {
    socketRef.current?.emit("join_room", { productId, buyerId });
  }, []);

  const leaveConversation = useCallback((productId, buyerId) => {
    socketRef.current?.emit("leave_room", { productId, buyerId });
  }, []);

  const sendChatMessage = useCallback(
    (productId, receiverId, content, imageUrl = null, location = null) => {
      socketRef.current?.emit("send_message", {
        productId,
        receiverId,
        content,
        imageUrl,
        location,
      });
    },
    [],
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        sendChatMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
