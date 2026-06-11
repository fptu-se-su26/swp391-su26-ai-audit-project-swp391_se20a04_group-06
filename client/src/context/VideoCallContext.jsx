import { createContext, useContext } from "react";

// 1. Khởi tạo Context cuộc gọi
export const VideoCallContext = createContext(null);

// 2. Custom hook để các component lấy trạng thái cuộc gọi
export function useVideoCall() {
  const ctx = useContext(VideoCallContext);
  if (!ctx) {
    throw new Error(
      "useVideoCall phải được sử dụng bên trong VideoCallProvider",
    );
  }
  return ctx;
}
