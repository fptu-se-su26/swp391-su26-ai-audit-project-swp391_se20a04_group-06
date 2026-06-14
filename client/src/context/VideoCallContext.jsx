// Nhập hàm createContext và useContext từ thư viện React để quản lý dữ liệu chia sẻ
import { createContext, useContext } from "react";

// Khởi tạo đối tượng Context quản lý thông tin cuộc gọi video, mặc định ban đầu là null
export const VideoCallContext = createContext(null);

// Định nghĩa Custom hook useVideoCall giúp các component con lấy nhanh trạng thái cuộc gọi
export function useVideoCall() {
  // Lấy giá trị context hiện tại của VideoCallContext từ cây component
  const ctx = useContext(VideoCallContext);
  // Nếu không tìm thấy context (do component gọi hook nằm ngoài VideoCallProvider)
  if (!ctx) {
    // Ném ra lỗi cảnh báo nhà phát triển
    throw new Error(
      "useVideoCall phải được sử dụng bên trong VideoCallProvider",
    );
  }
  // Trả về đối tượng chứa trạng thái cuộc gọi và các phương thức thực hiện cuộc gọi
  return ctx;
}
