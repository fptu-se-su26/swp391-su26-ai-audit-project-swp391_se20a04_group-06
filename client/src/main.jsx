// Nhập chế độ kiểm tra nghiêm ngặt StrictMode của React để phát hiện sớm lỗi phát triển
import { StrictMode } from "react";
// Nhập phương thức khởi tạo Root DOM từ thư viện react-dom để gắn kết React App vào HTML
import { createRoot } from "react-dom/client";
// Nạp các style CSS của thư viện Bootstrap phục vụ một số lớp căn chỉnh nhanh
import "bootstrap/dist/css/bootstrap.min.css";
// Nạp file CSS định nghĩa biến và lớp tiện ích toàn cục của dự án
import "./index.css";
// Nhập component gốc App chứa toàn bộ cấu trúc định tuyến và trạng thái ứng dụng
import App from "./App.jsx";

// Tìm kiếm thẻ div có id="root" trong index.html, tạo điểm gốc (Root) và render ứng dụng
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Bao bọc App trong StrictMode để kiểm tra các side effect thừa và cảnh báo API cũ */}
    <App />
  </StrictMode>,
);
