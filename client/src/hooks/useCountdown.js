// Nhập các hook useState và useEffect từ thư viện React để quản lý state và tác vụ hẹn giờ
import { useState, useEffect } from "react";

// Custom hook useCountdown tính toán thời gian đếm ngược (độ tươi sống 24 giờ của hải sản) từ mốc catchTime
export function useCountdown(catchTime) {
  // State rem lưu trữ chuỗi thời gian còn lại (ví dụ: "12h 30m" hoặc "Hết hạn"), mặc định là chuỗi rỗng
  const [rem, setRem] = useState("");

  // useEffect tự động cập nhật thời gian đếm ngược mỗi 30 giây khi catchTime thay đổi
  useEffect(() => {
    // Nếu không có thời gian đánh bắt (catchTime), thoát ra và không làm gì cả
    if (!catchTime) return;

    // Định nghĩa hàm tick để tính toán khoảng thời gian chênh lệch còn lại
    const tick = () => {
      // Tính toán khoảng cách thời gian còn lại: 24 giờ (đổi sang mili giây) trừ đi thời gian đã trôi qua kể từ lúc đánh bắt
      const diff = 24 * 3600000 - (Date.now() - new Date(catchTime).getTime());
      
      // Nếu thời gian chênh lệch nhỏ hơn hoặc bằng 0, hải sản đã quá hạn 24 giờ, cập nhật state thành "Hết hạn"
      if (diff <= 0) return setRem("Hết hạn");
      
      // Tính số giờ còn lại
      const h = Math.floor(diff / 3600000);
      // Tính số phút còn lại sau khi trừ đi phần giờ
      const m = Math.floor((diff % 3600000) / 60000);
      
      // Cập nhật state rem thành chuỗi hiển thị giờ và phút còn lại
      setRem(`${h}h ${m}m`);
    };

    // Gọi hàm tick ngay lập tức để tính khoảng thời gian lần đầu mà không phải đợi 30 giây
    tick();

    // Thiết lập một bộ đếm thời gian lặp lại mỗi 30 giây (30000ms) để cập nhật lại khoảng thời gian còn lại
    const id = setInterval(tick, 30000);

    // Cleanup function: Xóa bộ đếm lặp lại khi component chứa hook bị unmount hoặc catchTime thay đổi
    return () => clearInterval(id);
  }, [catchTime]); // Chạy lại hiệu ứng đếm ngược nếu mốc thời gian đánh bắt thay đổi

  // Trả về chuỗi mô tả thời gian đếm ngược còn lại
  return rem;
}
