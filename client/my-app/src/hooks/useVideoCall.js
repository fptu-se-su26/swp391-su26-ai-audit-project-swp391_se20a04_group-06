/**
 * useVideoCall.js
 * 
 * ĐỂ ĐƯA CHỨC NĂNG GỌI VIDEO RA TOÀN BỘ MÀN HÌNH (HomePage, Dashboard, Profile...):
 * Chúng ta đã đóng gói toàn bộ trạng thái WebRTC và Camera vào VideoCallProvider toàn cục.
 * 
 * File này đóng vai trò là một "Cổng kết nối" (Re-export) giúp kết nối 
 * các trang trong dự án (như ChatBox.jsx) sử dụng chung một luồng đàm thoại Global duy nhất,
 * giúp khắc phục triệt để lỗi xung đột đen màn hình 1 phía.
 */
import { useVideoCall as useGlobalVideoCall } from "../context/VideoCallContext";

export function useVideoCall() {
    return useGlobalVideoCall();
}